// server/api/profile/posts.get.ts
import { eventHandler, getQuery, createError } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'

export default eventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const q = getQuery(event)
  const rawTake = Number(q.take ?? 20)
  const take = Math.min(Math.max(rawTake || 20, 1), 50) 
  const cursorId = typeof q.cursor === 'string' && q.cursor.length > 0 ? q.cursor : null

  const posts = await prisma.posting.findMany({
    where: { userId: session.user.id },
    orderBy: { date: 'desc' },
    take: take + 1,
    ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
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
      _count: {
        select: {
          reactions: true,
          comments: true,
        },
      },
    },
  })

  let nextCursor: string | null = null
  let items = posts

  if (posts.length > take) {
    const last = posts[posts.length - 1]!
    nextCursor = last.id
    items = posts.slice(0, take)
  }

  return {
    items: items.map((p) => ({
      id: p.id,
      createdAt: p.date.toISOString(),
      text: p.text ?? '',
      visibility: p.visibility,
      image: p.image ?? null,  
      reactions: p._count.reactions,
      comments: p._count.comments,
      distanceInMeters: p.runningExercise?.distanceInMeters ?? null,
      durationInSeconds: p.runningExercise?.durationInSeconds ?? null,
      source: p.runningExercise?.source ?? null,
    })),
    nextCursor,
  }
})
