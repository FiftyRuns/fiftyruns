import { createError, eventHandler } from 'h3'
import { prisma } from '../../utils/prisma'
import { getGarminConfig, ensureGarminAccessToken, GARMIN_DISCONNECT_URL } from '../../utils/garmin'

export default eventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: {
      id: true,
      garminOAuth2AccessToken: true,
      garminOAuth2RefreshToken: true,
      garminOAuth2TokenExpiry: true,
      garminUserId: true,
    },
  })

  if (!user) {
    throw createError({ statusCode: 404, message: 'Benutzer nicht gefunden.' })
  }

  // Wenn der Nutzer bereits getrennt ist, einfach OK zurückgeben
  if (!user.garminUserId) {
    return { ok: true }
  }

  // Access-Token sicherstellen (refreshen falls nötig)
  let accessToken: string | null = null
  try {
    if (user.garminOAuth2AccessToken && user.garminOAuth2RefreshToken) {
      accessToken = await ensureGarminAccessToken({
        id: user.id,
        garminOAuth2AccessToken: user.garminOAuth2AccessToken,
        garminOAuth2RefreshToken: user.garminOAuth2RefreshToken,
        garminOAuth2TokenExpiry: user.garminOAuth2TokenExpiry,
      })
    }
  } catch (err) {
    if (process.dev) {
      console.warn('[garmin] Token-Refresh vor Disconnect fehlgeschlagen', err)
    }
    // Wir fahren trotzdem fort und löschen die lokalen Daten
  }

  // Disconnect-Request an Garmin senden
  if (accessToken) {
    try {
      const response = await fetch(GARMIN_DISCONNECT_URL, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (!response.ok && process.dev) {
        console.warn('[garmin] Disconnect Response', response.status)
      }
    } catch (err) {
      if (process.dev) {
        console.warn('[garmin] Disconnect-Request fehlgeschlagen', err)
      }
      // Wir löschen die lokalen Daten trotzdem
    }
  }

  // Lokale Daten löschen
  await prisma.$transaction([
    prisma.user.update({
      where: { id: auth.user.id },
      data: {
        garminOAuth2AccessToken: null,
        garminOAuth2RefreshToken: null,
        garminOAuth2TokenExpiry: null,
        garminConnectedAt: null,
        garminUserId: null,
      },
    }),
    prisma.garminOAuth2.deleteMany({ where: { userId: auth.user.id } }),
  ])

  return { ok: true }
})


