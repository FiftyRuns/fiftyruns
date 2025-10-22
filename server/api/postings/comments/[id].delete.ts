import { createError, eventHandler } from 'h3'
import { prisma } from '../../../utils/prisma'
import { resolveSession } from '../../../utils/session'
import { assertCsrf } from '../../../utils/csrf'

export default eventHandler(async (event) => {
  assertCsrf(event)

  const session = await resolveSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const id = event.context.params?.id
  if (!id || typeof id !== 'string') {
    throw createError({ statusCode: 400, message: 'Kommentar-ID fehlt.' })
  }

  const comment = await prisma.comment.findUnique({
    where: { id },
    select: {
      userId: true,
      postingId: true,
    },
  })

  if (!comment) {
    throw createError({ statusCode: 404, message: 'Kommentar nicht gefunden.' })
  }

  if (comment.userId !== session.user.id) {
    throw createError({ statusCode: 403, message: 'Keine Berechtigung.' })
  }

  await prisma.comment.delete({ where: { id } })

  return { ok: true, postingId: comment.postingId }
})
