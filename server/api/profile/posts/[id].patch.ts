import { createError, eventHandler, getCookie, getHeader, readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { resolveSession } from '../../../utils/session'

type UpdatePostBody = {
  content?: string
  visibility?: 'public' | 'protected' | 'private'
  image?: string | null
}

function assertCsrf(event: Parameters<typeof getHeader>[0]) {
  const header = getHeader(event, 'x-csrf-token') || ''
  const cookie = getCookie(event, 'csrf_token') || ''
  if (!header || !cookie || header !== cookie) {
    throw createError({ statusCode: 403, message: 'CSRF-Prüfung fehlgeschlagen.' })
  }
}

export default eventHandler(async (event) => {
  assertCsrf(event)

  const session = await resolveSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, message: 'Post-ID fehlt.' })
  }

const body = (await readBody<UpdatePostBody>(event)) || {}

const post = await prisma.posting.findUnique({
  where: { id },
  select: { userId: true },
})

if (!post || post.userId !== session.user.id) {
  throw createError({ statusCode: 404, message: 'Beitrag nicht gefunden.' })
}

const updateData: { text?: string; visibility?: 'public' | 'protected' | 'private'; image?: string | null } = {}

if (typeof body.content === 'string') {
  const trimmed = body.content.trim()
  if (!trimmed) {
    throw createError({ statusCode: 400, message: 'Beitragsinhalt darf nicht leer sein.' })
  }
  updateData.text = trimmed
}

if (body.visibility) {
  if (!['public', 'protected', 'private'].includes(body.visibility)) {
    throw createError({ statusCode: 400, message: 'Ungültige Sichtbarkeit.' })
  }
  updateData.visibility = body.visibility
}

if ('image' in body) {
  updateData.image = body.image ?? null
}

if (Object.keys(updateData).length === 0) {
  throw createError({ statusCode: 400, message: 'Keine Änderungen übermittelt.' })
}

await prisma.posting.update({
  where: { id },
  data: updateData,
})

  return { ok: true }
})
