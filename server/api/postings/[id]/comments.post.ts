// server/api/postings/[id]/comments.post.ts
import { createError, eventHandler, readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { resolveSession } from '../../../utils/session'
import { assertCsrf } from '../../../utils/csrf'

type CreateCommentBody = {
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
    throw createError({ statusCode: 400, message: 'Post-ID fehlt.' })
  }

  const body = (await readBody<CreateCommentBody>(event)) || {}
  const text = (body.text ?? '').trim()
  if (!text) {
    throw createError({ statusCode: 400, message: 'Kommentar darf nicht leer sein.' })
  }

  const post = await prisma.posting.findUnique({
    where: { id },
    select: { id: true, visibility: true, userId: true },
  })

  if (!post) {
    throw createError({ statusCode: 404, message: 'Beitrag nicht gefunden.' })
  }

  if (post.visibility === 'private' && post.userId !== session.user.id) {
    throw createError({ statusCode: 403, message: 'Dieser Beitrag ist privat.' })
  }

  const comment = await prisma.comment.create({
    data: {
      text,
      postingId: post.id,
      userId: session.user.id,
    },
    select: {
      id: true,
      text: true,
      date: true,
      user: {
        select: { id: true, name: true, nameId: true, image: true },
      },
    },
  })

  return {
    id: comment.id,
    text: comment.text,
    createdAt: comment.date.toISOString(),
    author: {
      id: comment.user.id,
      name: comment.user.name,
      nameId: comment.user.nameId,
      image: comment.user.image ?? null,
    },
  }
})
