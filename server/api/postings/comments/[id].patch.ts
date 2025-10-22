import { createError, eventHandler, readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { resolveSession } from '../../../utils/session'
import { assertCsrf } from '../../../utils/csrf'

type UpdateCommentBody = {
  text?: string
}

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

  const body = (await readBody<UpdateCommentBody>(event)) || {}
  const text = (body.text ?? '').trim()
  if (!text) {
    throw createError({ statusCode: 400, message: 'Kommentar darf nicht leer sein.' })
  }

  const comment = await prisma.comment.findUnique({
    where: { id },
    select: {
      userId: true,
    },
  })

  if (!comment) {
    throw createError({ statusCode: 404, message: 'Kommentar nicht gefunden.' })
  }

  if (comment.userId !== session.user.id) {
    throw createError({ statusCode: 403, message: 'Keine Berechtigung.' })
  }

  const updated = await prisma.comment.update({
    where: { id },
    data: { text },
    select: {
      id: true,
      text: true,
      date: true,
      postingId: true,
    },
  })

  return {
    id: updated.id,
    text: updated.text,
    createdAt: updated.date.toISOString(),
    postingId: updated.postingId,
  }
})
