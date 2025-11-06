import { randomBytes } from 'node:crypto'
import { createError } from 'h3'
import { prisma } from './prisma'

export const STRAVA_AUTHORIZE_URL = 'https://www.strava.com/oauth/authorize'
export const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token'
export const STRAVA_DEAUTHORIZE_URL = 'https://www.strava.com/oauth/deauthorize'
export const STRAVA_ACTIVITY_URL = 'https://www.strava.com/api/v3/activities'

const DEFAULT_SCOPE = 'activity:read,activity:read_all'
const STATE_TTL_SECONDS = 60 * 15
const DEFAULT_WEBHOOK_VERIFY_TOKEN = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN || ''
const DEFAULT_WEBHOOK_CALLBACK_URL = process.env.STRAVA_WEBHOOK_CALLBACK_URL || ''

export const STRAVA_SUPPORTED_SPORT_TYPES = new Set([
  'Run',
  'TrailRun',
  'VirtualRun',
])

export type StravaConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
  scope: string[]
}

export type StravaTokenPayload = {
  access_token: string
  refresh_token: string
  expires_at: number
  athlete?: {
    id?: number
  }
  scope?: string | string[]
}

export type StravaActivity = {
  id: number
  name?: string
  distance?: number
  moving_time?: number
  elapsed_time?: number
  start_date?: string
  start_date_local?: string
  visibility?: string
  sport_type?: string
  private?: boolean
  trainer?: boolean
  commute?: boolean
}

export function getStravaConfig(): StravaConfig {
  const clientId = process.env.STRAVA_CLIENT_ID
  const clientSecret = process.env.STRAVA_CLIENT_SECRET
  const redirectUri = process.env.STRAVA_REDIRECT_URI
  const scopeString = process.env.STRAVA_DEFAULT_SCOPE || DEFAULT_SCOPE

  if (!clientId || !clientSecret || !redirectUri) {
    throw createError({
      statusCode: 500,
      message: 'Strava-Konfiguration fehlt. Bitte STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET und STRAVA_REDIRECT_URI setzen.',
    })
  }

  const scope = parseStravaScopes(scopeString)

  return { clientId, clientSecret, redirectUri, scope }
}

export function createStateToken(byteLength: number = 48): string {
  return randomBytes(byteLength).toString('base64url')
}

export async function createStravaState(userId: string, ttlSeconds: number = STATE_TTL_SECONDS): Promise<string> {
  const state = createStateToken()
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000)

  await prisma.$transaction([
    prisma.stravaOAuthState.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    prisma.stravaOAuthState.create({
      data: {
        state,
        userId,
        expiresAt,
      },
    }),
  ])

  return state
}

export async function findStravaState(state: string) {
  if (!state) return null
  const record = await prisma.stravaOAuthState.findUnique({ where: { state } })
  if (!record) return null
  if (record.expiresAt.getTime() <= Date.now()) {
    await prisma.stravaOAuthState.delete({ where: { state } }).catch(() => {})
    return null
  }
  return record
}

export async function consumeStravaState(state: string) {
  if (!state) return
  await prisma.stravaOAuthState.delete({ where: { state } }).catch(() => {})
}

export function parseStravaScopes(value?: string | string[] | null): string[] {
  if (!value) return []

  const asArray = Array.isArray(value) ? value : [value]
  const scopes: string[] = []

  for (const entry of asArray) {
    if (entry == null) continue
    const raw = String(entry).trim()
    if (!raw) continue

    // Try parsing JSON arrays/strings if provided that way
    if ((raw.startsWith('[') && raw.endsWith(']')) || (raw.startsWith('"') && raw.endsWith('"'))) {
      try {
        const parsed = JSON.parse(raw)
        scopes.push(...parseStravaScopes(parsed))
        continue
      } catch {
        // Fallback to manual parsing
      }
    }

    raw
      .split(/[,\s]+/)
      .map((scope) => scope.replace(/^['"]+|['"]+$/g, '').trim())
      .filter(Boolean)
      .forEach((scope) => scopes.push(scope))
  }

  return Array.from(new Set(scopes))
}

export function shouldRefreshToken(expiresAt: Date | null | undefined, windowSeconds: number = 60 * 60): boolean {
  if (!expiresAt) return true
  const threshold = expiresAt.getTime() - windowSeconds * 1000
  return threshold <= Date.now()
}

export async function requestStravaToken(params: URLSearchParams): Promise<StravaTokenPayload> {
  const response = await fetch(STRAVA_TOKEN_URL, {
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
      message: 'Strava-Token konnte nicht bezogen werden.',
      data: { detail: errorBody?.slice?.(0, 500) ?? 'unknown_error' },
    })
  }

  return (await response.json()) as StravaTokenPayload
}

export function getStravaWebhookConfig() {
  if (!DEFAULT_WEBHOOK_VERIFY_TOKEN || !DEFAULT_WEBHOOK_CALLBACK_URL) {
    throw createError({
      statusCode: 500,
      message:
        'Strava Webhook-Konfiguration fehlt. Bitte STRAVA_WEBHOOK_VERIFY_TOKEN und STRAVA_WEBHOOK_CALLBACK_URL setzen.',
    })
  }
  return {
    verifyToken: DEFAULT_WEBHOOK_VERIFY_TOKEN,
    callbackUrl: DEFAULT_WEBHOOK_CALLBACK_URL,
  }
}

type UserTokenBundle = {
  id: string
  stravaAccessToken: string | null
  stravaRefreshToken: string | null
  stravaTokenExpiresAt: Date | null
}

export async function ensureStravaAccessToken(user: UserTokenBundle): Promise<string> {
  if (!user.stravaAccessToken || !user.stravaRefreshToken) {
    throw createError({ statusCode: 401, message: 'Strava-Token nicht verfügbar.' })
  }

  if (!shouldRefreshToken(user.stravaTokenExpiresAt)) {
    return user.stravaAccessToken
  }

  const { clientId, clientSecret } = getStravaConfig()
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: user.stravaRefreshToken,
  })

  const payload = await requestStravaToken(params)
  const expiresEpoch = Number(payload.expires_at ?? 0)
  const expiresAt =
    Number.isFinite(expiresEpoch) && expiresEpoch > 0 ? new Date(expiresEpoch * 1000) : new Date(Date.now() + 6 * 60 * 60 * 1000)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      stravaAccessToken: payload.access_token,
      stravaRefreshToken: payload.refresh_token,
      stravaTokenExpiresAt: expiresAt,
    },
  })

  return payload.access_token
}

export async function fetchStravaActivity(accessToken: string, activityId: string): Promise<StravaActivity> {
  const response = await fetch(`${STRAVA_ACTIVITY_URL}/${activityId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw createError({
      statusCode: 502,
      message: `Aktivität ${activityId} konnte nicht geladen werden.`,
      data: { detail: body?.slice?.(0, 500) ?? 'unknown_error' },
    })
  }

  return (await response.json()) as StravaActivity
}

export function mapStravaVisibility(activity: StravaActivity): 'public' | 'protected' | 'private' {
  if (activity.private) return 'private'
  if (activity.visibility === 'everyone') return 'public'
  if (activity.visibility === 'followers_only' || activity.visibility === 'followers') return 'protected'
  return 'protected'
}
