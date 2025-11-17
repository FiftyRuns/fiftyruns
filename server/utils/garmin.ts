import { createHash, randomBytes } from 'node:crypto'
import { createError } from 'h3'
import { prisma } from './prisma'
import { createStateToken, shouldRefreshToken } from './strava'

export const GARMIN_AUTHORIZE_URL = 'https://connect.garmin.com/oauth2Confirm'
export const GARMIN_TOKEN_URL = 'https://diauth.garmin.com/di-oauth2-service/oauth/token'
export const GARMIN_USER_ID_URL = 'https://apis.garmin.com/wellness-api/rest/user/id'
export const GARMIN_USER_PERMISSIONS_URL = 'https://apis.garmin.com/wellness-api/rest/user/permissions'
export const GARMIN_DISCONNECT_URL = 'https://apis.garmin.com/wellness-api/rest/user/registration'

const STATE_TTL_SECONDS = 60 * 10 // 10 Minuten für OAuth State
const TOKEN_EXPIRY_BUFFER_SECONDS = 60 // 1 Minute Puffer vor Ablauf

// Unterstützte Lauf- und Gehaktivitätstypen von Garmin
export const GARMIN_RUNNING_ACTIVITY_TYPES = new Set([
  'RUNNING',
  'INDOOR_RUNNING',
  'STREET_RUNNING',
  'TRACK_RUNNING',
  'TRAIL_RUNNING',
  'TREADMILL_RUNNING',
  'ULTRA_RUN',
  'VIRTUAL_RUN',
  'WALKING',
  'CASUAL_WALKING',
  'SPEED_WALKING',
])

export type GarminConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export type GarminTokenPayload = {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type?: string
}

export type GarminUserIdResponse = {
  userId: string
}

export type GarminUserPermissionsResponse = {
  permissions: Array<{
    permission: string
    granted: boolean
  }>
}

export type GarminActivitySummary = {
  userId: string
  summaryId: string
  activityId?: string
  activityType: string
  startTimeInSeconds: number
  startTimeOffsetInSeconds: number
  durationInSeconds: number
  distanceInMeters: number
  activityName?: string
  deviceName?: string
  manual?: boolean
  [key: string]: unknown
}

export type GarminWebhookPayload = {
  activities?: GarminActivitySummary[]
  manuallyUpdatedActivities?: GarminActivitySummary[]
  [key: string]: unknown
}

/**
 * Generiert einen Code Verifier für PKCE (RFC 7636)
 */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * Generiert einen Code Challenge aus einem Code Verifier (S256)
 */
export function generateCodeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url')
}

/**
 * Ruft die Garmin-Konfiguration aus Umgebungsvariablen ab
 */
export function getGarminConfig(): GarminConfig {
  const clientId = process.env.GARMIN_CLIENT_ID
  const clientSecret = process.env.GARMIN_CLIENT_SECRET
  const redirectUri = process.env.GARMIN_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    throw createError({
      statusCode: 500,
      message:
        'Garmin-Konfiguration fehlt. Bitte GARMIN_CLIENT_ID, GARMIN_CLIENT_SECRET und GARMIN_REDIRECT_URI setzen.',
    })
  }

  return { clientId, clientSecret, redirectUri }
}

/**
 * Erstellt einen Garmin OAuth2 State-Eintrag in der Datenbank
 */
export async function createGarminOAuth2State(
  userId: string,
  codeVerifier: string,
  state?: string,
  ttlSeconds: number = STATE_TTL_SECONDS,
): Promise<string> {
  const finalState = state || createStateToken()
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000)

  await prisma.$transaction([
    // Alte abgelaufene Einträge löschen
    prisma.garminOAuth2.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { userId }],
      },
    }),
    // Neuen Eintrag erstellen
    prisma.garminOAuth2.create({
      data: {
        userId,
        codeVerifier,
        state: finalState,
        expiresAt,
      },
    }),
  ])

  return finalState
}

/**
 * Findet einen Garmin OAuth2 State-Eintrag
 */
export async function findGarminOAuth2State(state: string) {
  if (!state) return null
  const record = await prisma.garminOAuth2.findFirst({
    where: { state },
  })
  if (!record) return null
  if (record.expiresAt.getTime() <= Date.now()) {
    await prisma.garminOAuth2.delete({ where: { id: record.id } }).catch(() => {})
    return null
  }
  return record
}

/**
 * Verbraucht einen Garmin OAuth2 State-Eintrag (löscht ihn)
 */
export async function consumeGarminOAuth2State(state: string) {
  if (!state) return
  await prisma.garminOAuth2.deleteMany({ where: { state } }).catch(() => {})
}

/**
 * Tauscht einen Authorization Code gegen Access/Refresh Tokens
 */
export async function requestGarminToken(params: URLSearchParams): Promise<GarminTokenPayload> {
  const response = await fetch(GARMIN_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw createError({
      statusCode: 502,
      message: 'Garmin-Token konnte nicht bezogen werden.',
      data: { detail: errorBody?.slice?.(0, 500) ?? 'unknown_error' },
    })
  }

  return (await response.json()) as GarminTokenPayload
}

/**
 * Ruft die Garmin User-ID ab
 */
export async function fetchGarminUserId(accessToken: string): Promise<string> {
  const response = await fetch(GARMIN_USER_ID_URL, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw createError({
      statusCode: 502,
      message: 'Garmin User-ID konnte nicht abgerufen werden.',
      data: { detail: body?.slice?.(0, 500) ?? 'unknown_error' },
    })
  }

  const data = (await response.json()) as GarminUserIdResponse
  return data.userId
}

/**
 * Ruft die Garmin User-Berechtigungen ab
 */
export async function fetchGarminUserPermissions(accessToken: string): Promise<GarminUserPermissionsResponse> {
  const response = await fetch(GARMIN_USER_PERMISSIONS_URL, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw createError({
      statusCode: 502,
      message: 'Garmin-Berechtigungen konnten nicht abgerufen werden.',
      data: { detail: body?.slice?.(0, 500) ?? 'unknown_error' },
    })
  }

  return (await response.json()) as GarminUserPermissionsResponse
}

/**
 * Prüft, ob der Nutzer die ACTIVITY_EXPORT Berechtigung hat
 */
export function hasActivityExportPermission(permissions: GarminUserPermissionsResponse): boolean {
  return (
    permissions.permissions?.some(
      (p) => p.permission === 'ACTIVITY_EXPORT' && p.granted === true,
    ) ?? false
  )
}

/**
 * Stellt sicher, dass ein gültiges Access-Token verfügbar ist (refresht bei Bedarf)
 */
type UserTokenBundle = {
  id: string
  garminOAuth2AccessToken: string | null
  garminOAuth2RefreshToken: string | null
  garminOAuth2TokenExpiry: Date | null
}

export async function ensureGarminAccessToken(user: UserTokenBundle): Promise<string> {
  if (!user.garminOAuth2AccessToken || !user.garminOAuth2RefreshToken) {
    throw createError({ statusCode: 401, message: 'Garmin-Token nicht verfügbar.' })
  }

  if (!shouldRefreshToken(user.garminOAuth2TokenExpiry)) {
    return user.garminOAuth2AccessToken
  }

  const { clientId, clientSecret } = getGarminConfig()
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: user.garminOAuth2RefreshToken,
  })

  const payload = await requestGarminToken(params)
  const expiresAt = new Date(Date.now() + (payload.expires_in - TOKEN_EXPIRY_BUFFER_SECONDS) * 1000)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      garminOAuth2AccessToken: payload.access_token,
      garminOAuth2RefreshToken: payload.refresh_token,
      garminOAuth2TokenExpiry: expiresAt,
    },
  })

  return payload.access_token
}

/**
 * Berechnet das Ablaufdatum für ein Token mit Puffer
 */
export function calculateTokenExpiry(expiresIn: number): Date {
  return new Date(Date.now() + (expiresIn - TOKEN_EXPIRY_BUFFER_SECONDS) * 1000)
}

