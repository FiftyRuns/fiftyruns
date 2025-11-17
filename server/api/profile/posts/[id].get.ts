// server/api/profile/posts/[id].get.ts
import { createError, eventHandler } from 'h3'
import { prisma } from '../../../utils/prisma'
import { resolveSession } from '../../../utils/session'

export default eventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const id = event.context.params?.id
  if (!id || typeof id !== 'string') {
    throw createError({ statusCode: 400, message: 'Post-ID fehlt.' })
  }

  const post = await prisma.posting.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      date: true,
      text: true,
      visibility: true,
      image: true,
      runningExercise: {
        select: {
          distanceInMeters: true,
          durationInSeconds: true,
          source: true,
        },
      },
    },
  })

  if (!post) {
    throw createError({ statusCode: 404, message: 'Beitrag nicht gefunden.' })
  }

  return {
    id: post.id,
    createdAt: post.date.toISOString(),
    text: post.text ?? '',
    visibility: post.visibility,
    image: post.image ?? null,
    distanceInMeters: post.runningExercise?.distanceInMeters ?? null,
    durationInSeconds: post.runningExercise?.durationInSeconds ?? null,
    source: post.runningExercise?.source ?? null,
  }
})
