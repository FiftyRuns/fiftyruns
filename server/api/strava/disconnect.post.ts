import { createError, eventHandler } from 'h3'
import { prisma } from '../../utils/prisma'
import {
  STRAVA_DEAUTHORIZE_URL,
  getStravaConfig,
  requestStravaToken,
  shouldRefreshToken,
} from '../../utils/strava'

export default eventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: {
      stravaAccessToken: true,
      stravaRefreshToken: true,
      stravaTokenExpiresAt: true,
    },
  })

  if (!user) {
    throw createError({ statusCode: 404, message: 'Benutzer nicht gefunden.' })
  }

  const { clientId, clientSecret } = getStravaConfig()

  let accessToken = user.stravaAccessToken ?? ''
  const refreshToken = user.stravaRefreshToken ?? ''

  if ((!accessToken || shouldRefreshToken(user.stravaTokenExpiresAt)) && refreshToken) {
    try {
      const refreshParams = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      })
      const refreshPayload = await requestStravaToken(refreshParams)
      accessToken = refreshPayload.access_token
    } catch (err) {
      if (process.dev) {
        console.warn('[strava] Token-Refresh vor Deauthorize fehlgeschlagen', err)
      }
    }
  }

  if (accessToken) {
    try {
      const response = await fetch(STRAVA_DEAUTHORIZE_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (!response.ok && process.dev) {
        console.warn('[strava] Deauthorize Response', response.status)
      }
    } catch (err) {
      if (process.dev) {
        console.warn('[strava] Deauthorize-Request fehlgeschlagen', err)
      }
    }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: auth.user.id },
      data: {
        stravaAthleteId: null,
        stravaAccessToken: null,
        stravaRefreshToken: null,
        stravaTokenExpiresAt: null,
        stravaScopes: [],
        stravaConnectedAt: null,
        stravaDeauthorizedAt: new Date(),
      },
    }),
    prisma.stravaOAuthState.deleteMany({ where: { userId: auth.user.id } }),
  ])

  return { ok: true }
})
