import { createError, eventHandler, getQuery, sendRedirect } from 'h3'
import { prisma } from '../../utils/prisma'
import {
  consumeGarminOAuth2State,
  findGarminOAuth2State,
  getGarminConfig,
  requestGarminToken,
  fetchGarminUserId,
  fetchGarminUserPermissions,
  hasActivityExportPermission,
  calculateTokenExpiry,
} from '../../utils/garmin'

function redirectToSettings(event: Parameters<typeof sendRedirect>[0], status: string) {
  return sendRedirect(event, `/profile/settings?garmin=${status}`, 302)
}

export default eventHandler(async (event) => {
  const query = getQuery(event)
  const { code, state, error } = query

  if (!state || typeof state !== 'string') {
    throw createError({ statusCode: 400, message: 'Ungültiger OAuth-Zustand.' })
  }

  if (error) {
    await consumeGarminOAuth2State(state)
    return redirectToSettings(event, 'cancelled')
  }

  if (!code || typeof code !== 'string') {
    await consumeGarminOAuth2State(state)
    throw createError({ statusCode: 400, message: 'Autorisierungscode fehlt.' })
  }

  const auth = event.context.auth
  if (!auth) {
    await consumeGarminOAuth2State(state)
    return redirectToSettings(event, 'unauthorized')
  }

  const storedState = await findGarminOAuth2State(state)
  if (!storedState || storedState.userId !== auth.user.id) {
    await consumeGarminOAuth2State(state)
    return redirectToSettings(event, 'invalid_state')
  }

  const { clientId, clientSecret, redirectUri } = getGarminConfig()

  // Token-Exchange durchführen
  let tokenPayload
  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: storedState.codeVerifier,
      redirect_uri: redirectUri,
    })
    tokenPayload = await requestGarminToken(params)
  } catch (err) {
    if (process.dev) {
      console.error('[garmin] Token-Tausch fehlgeschlagen', err)
    }
    await consumeGarminOAuth2State(state)
    return redirectToSettings(event, 'token_error')
  }

  // Garmin User-ID abrufen
  let garminUserId: string | null = null
  try {
    garminUserId = await fetchGarminUserId(tokenPayload.access_token)
  } catch (err) {
    if (process.dev) {
      console.error('[garmin] User-ID konnte nicht abgerufen werden', err)
    }
    await consumeGarminOAuth2State(state)
    return redirectToSettings(event, 'userid_error')
  }

  // Optional: Berechtigungen prüfen
  try {
    const permissions = await fetchGarminUserPermissions(tokenPayload.access_token)
    if (!hasActivityExportPermission(permissions)) {
      if (process.dev) {
        console.warn('[garmin] ACTIVITY_EXPORT Berechtigung fehlt')
      }
      // Wir speichern trotzdem, aber warnen
    }
  } catch (err) {
    if (process.dev) {
      console.warn('[garmin] Berechtigungen konnten nicht geprüft werden', err)
    }
    // Nicht kritisch, wir fahren fort
  }

  // Token-Expiry berechnen
  const expiresAt = calculateTokenExpiry(tokenPayload.expires_in)

  // Daten speichern
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: auth.user.id },
        data: {
          garminOAuth2AccessToken: tokenPayload.access_token,
          garminOAuth2RefreshToken: tokenPayload.refresh_token,
          garminOAuth2TokenExpiry: expiresAt,
          garminConnectedAt: new Date(),
          garminUserId,
        },
      }),
      prisma.garminOAuth2.deleteMany({ where: { state } }),
    ])
  } catch (err) {
    if (process.dev) {
      console.error('[garmin] Token-Speicherung fehlgeschlagen', err)
    }
    await consumeGarminOAuth2State(state)
    return redirectToSettings(event, 'persist_error')
  }

  return redirectToSettings(event, 'connected')
})


