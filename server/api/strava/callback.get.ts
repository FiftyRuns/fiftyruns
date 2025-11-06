import { createError, eventHandler, getQuery, sendRedirect } from 'h3'
import { prisma } from '../../utils/prisma'
import {
  consumeStravaState,
  findStravaState,
  getStravaConfig,
  parseStravaScopes,
  requestStravaToken,
} from '../../utils/strava'

function redirectToSettings(event: Parameters<typeof sendRedirect>[0], status: string) {
  return sendRedirect(event, `/profile/settings?strava=${status}`, 302)
}

export default eventHandler(async (event) => {
  const query = getQuery(event)
  const { code, state, error } = query

  if (!state || typeof state !== 'string') {
    throw createError({ statusCode: 400, message: 'Ungültiger OAuth-Zustand.' })
  }

  if (error) {
    await consumeStravaState(state)
    return redirectToSettings(event, 'cancelled')
  }

  if (!code || typeof code !== 'string') {
    await consumeStravaState(state)
    throw createError({ statusCode: 400, message: 'Autorisierungscode fehlt.' })
  }

  const auth = event.context.auth
  if (!auth) {
    await consumeStravaState(state)
    return redirectToSettings(event, 'unauthorized')
  }

  const storedState = await findStravaState(state)
  if (!storedState || storedState.userId !== auth.user.id) {
    await consumeStravaState(state)
    return redirectToSettings(event, 'invalid_state')
  }

  const { clientId, clientSecret, redirectUri } = getStravaConfig()

  let tokenPayload
  try {
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    })
    tokenPayload = await requestStravaToken(params)
  } catch (err) {
    if (process.dev) {
      console.error('[strava] Token-Tausch fehlgeschlagen', err)
    }
    await consumeStravaState(state)
    return redirectToSettings(event, 'token_error')
  }

  const scopeFromQuery =
    typeof query.scope === 'string'
      ? query.scope
      : Array.isArray(query.scope)
        ? query.scope.join(',')
        : ''
  const scopes = parseStravaScopes(tokenPayload.scope ?? scopeFromQuery)
  const expiresEpochSeconds = Number(tokenPayload.expires_at ?? 0)
  const expiresAt =
    Number.isFinite(expiresEpochSeconds) && expiresEpochSeconds > 0
      ? new Date(expiresEpochSeconds * 1000)
      : new Date(Date.now() + 6 * 60 * 60 * 1000)
  const athleteId = tokenPayload.athlete?.id ? String(tokenPayload.athlete.id) : null
  const now = new Date()

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: auth.user.id },
        data: {
          stravaAthleteId: athleteId,
          stravaAccessToken: tokenPayload.access_token,
          stravaRefreshToken: tokenPayload.refresh_token,
          stravaTokenExpiresAt: expiresAt,
          stravaScopes: scopes,
          stravaConnectedAt: now,
          stravaDeauthorizedAt: null,
        },
      }),
      prisma.stravaOAuthState.deleteMany({ where: { state } }),
    ])
  } catch (err) {
    if (process.dev) {
      console.error('[strava] Token-Speicherung fehlgeschlagen', err)
    }
    await consumeStravaState(state)
    return redirectToSettings(event, 'persist_error')
  }

  return redirectToSettings(event, 'connected')
})
