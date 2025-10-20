import { createError, eventHandler, getCookie, getHeader, readBody } from 'h3'
import { del } from '@vercel/blob'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'

type UpdateAvatarBody = {
  imageData?: string | null
  imageUrl?: string | null
  previousUrl?: string | null
}

function assertCsrf(event: Parameters<typeof getHeader>[0]) {
  const header = getHeader(event, 'x-csrf-token') || ''
  const cookie = getCookie(event, 'csrf_token') || ''
  if (!header || !cookie || header !== cookie) {
    throw createError({ statusCode: 403, message: 'CSRF-Prüfung fehlgeschlagen.' })
  }
}

function sanitizeImageData(value: string | null | undefined) {
  if (!value) return null
  if (value.length > 2_000_000) {
    throw createError({ statusCode: 413, message: 'Bild ist zu groß.' })
  }
  if (!value.startsWith('data:image')) {
    throw createError({ statusCode: 400, message: 'Ungültiges Bildformat.' })
  }
  return value
}

function sanitizeImageUrl(value: string | null | undefined) {
  if (value == null || value === '') return null
  if (value.length > 2048) {
    throw createError({ statusCode: 413, message: 'Bild-URL ist zu lang.' })
  }
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw createError({ statusCode: 400, message: 'Ungültige Bild-URL.' })
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    throw createError({ statusCode: 400, message: 'Bild-URL muss http(s) verwenden.' })
  }
  return parsed.toString()
}

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

  const body = await readBody<UpdateAvatarBody>(event)
  const url = sanitizeImageUrl(body?.imageUrl)
  const image = sanitizeImageData(body?.imageData ?? null)

  const userId = session.user.id

  if (url !== null) {
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { image: true },
    })
    const previous = body?.previousUrl ?? userRecord?.image ?? null

    await prisma.user.update({
      where: { id: userId },
      data: { image: url },
    })

    if (previous && previous !== url && isVercelBlobUrl(previous)) {
      try {
        await del(previous)
      } catch (err) {
        console.warn('[profile/avatar.patch] Altes Blob konnte nicht gelöscht werden:', err)
      }
    }

    return { ok: true, image: url }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { image },
  })

  return { ok: true, image }
})
