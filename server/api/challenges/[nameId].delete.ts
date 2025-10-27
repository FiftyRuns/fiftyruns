import { createError, eventHandler } from 'h3'
import { del } from '@vercel/blob'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'
import { assertCsrf } from '../../utils/csrf'

function isVercelBlobUrl(url: string | null | undefined) {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.hostname.endsWith('vercel-storage.com')
  } catch {
    return false
  }
}

export default eventHandler(async (event) => {
  assertCsrf(event)

  const session = await resolveSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const nameId = event.context.params?.nameId
  if (!nameId || typeof nameId !== 'string') {
    throw createError({ statusCode: 400, message: 'Challenge-Slug fehlt.' })
  }

  const challenge = await prisma.challenge.findUnique({
    where: { nameId },
    select: { id: true, adminUserId: true, image: true, sponsorLogos: true },
  })

  if (!challenge) {
    throw createError({ statusCode: 404, message: 'Challenge nicht gefunden.' })
  }

  if (challenge.adminUserId !== session.user.id) {
    throw createError({ statusCode: 403, message: 'Nur Challenge-Admins dürfen die Challenge löschen.' })
  }

  // Lösche Challenge-Titelbild aus Blob Storage
  if (challenge.image && isVercelBlobUrl(challenge.image)) {
    try {
      await del(challenge.image)
    } catch (err) {
      console.warn('[challenges/delete] Challenge-Image konnte nicht gelöscht werden:', err)
    }
  }

  // Lösche Sponsor-Logos aus Blob Storage
  if (challenge.sponsorLogos && Array.isArray(challenge.sponsorLogos)) {
    for (const logo of challenge.sponsorLogos) {
      if (typeof logo === 'string' && isVercelBlobUrl(logo)) {
        try {
          await del(logo)
        } catch (err) {
          console.warn('[challenges/delete] Sponsor-Logo konnte nicht gelöscht werden:', err)
        }
      }
    }
  }

  await prisma.challenge.delete({ where: { id: challenge.id } })

  return { ok: true }
})
