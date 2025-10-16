import { createError, eventHandler, getCookie, getHeader, readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'

type UpdateAvatarBody = {
  imageData?: string | null
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

export default eventHandler(async (event) => {
  assertCsrf(event)

  const session = await resolveSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const body = await readBody<UpdateAvatarBody>(event)
  const image = sanitizeImageData(body?.imageData ?? null)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image },
  })

  return { ok: true }
})
