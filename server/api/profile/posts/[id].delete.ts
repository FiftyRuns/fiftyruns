import { createError, eventHandler, getCookie, getHeader } from 'h3'
import { prisma } from '../../../utils/prisma'
import { resolveSession } from '../../../utils/session' 

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

  const post = await prisma.posting.findUnique({
    where: { id },
    select: { userId: true },
  })

  if (!post || post.userId !== session.user.id) {
    throw createError({ statusCode: 404, message: 'Beitrag nicht gefunden.' })
  }

  await prisma.posting.delete({ where: { id } })

  return { ok: true }
})
