// server/api/postings.get.ts
import { createError, eventHandler, getQuery, setResponseHeader } from 'h3'
import { prisma } from '../utils/prisma'
import { resolveSession } from '../utils/session'
import { REACTION_EMOJIS } from '../../app/constants/reactions'

export default eventHandler(async (event) => {
  const session = await resolveSession(event)

  const q = getQuery(event)
  const rawTake = Number(q.take ?? 20)
  const take = Math.min(Math.max(Number.isFinite(rawTake) ? rawTake : 20, 1), 50)
  const cursorId = typeof q.cursor === 'string' && q.cursor.length > 0 ? q.cursor : null

  // leichtes Private-Caching (passt trotz Session): verhindert Re-Fetch bei Back/Forward
  setResponseHeader(event, 'Cache-Control', 'private, max-age=30, stale-while-revalidate=60')

  // 1) Posts holen – nur nötige Felder, deterministisch sortiert
  const posts = await prisma.posting.findMany({
    where: { visibility: { in: ['public', 'protected'] } },
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
    take: take + 1,
    ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    select: {
      id: true,
      date: true,
      text: true,
      image: true,
      visibility: true,
      user: { select: { id: true, name: true, nameId: true, image: true } },
      runningExercise: { select: { distanceInMeters: true, durationInSeconds: true, source: true } },
      comments: {
        orderBy: { date: 'asc' },
        take: 5,
        select: {
          id: true,
          text: true,
          date: true,
          user: { select: { id: true, name: true, nameId: true, image: true } }
        }
      },
      _count: { select: { comments: true } } // Gesamtzahl für „weitere x Kommentare anzeigen“
    }
  })

  let nextCursor: string | null = null
  let items = posts
  if (posts.length > take) {
    nextCursor = posts[posts.length - 1]!.id
    items = posts.slice(0, take)
  }

  const postIds = items.map(p => p.id)
  if (postIds.length === 0) {
    return { items: [], nextCursor, emojis: REACTION_EMOJIS }
  }

  // 2) Reaktions-Counts in EINEM Query (SQL macht die Arbeit)
  const reactionCounts = await prisma.reaction.groupBy({
    by: ['postingId', 'type'],
    where: { postingId: { in: postIds } },
    _count: { _all: true }
  })

  const countsByPost = new Map<string, Record<string, number>>()
  for (const { postingId, type, _count } of reactionCounts) {
    if (postingId == null) continue
    const m = countsByPost.get(postingId) ?? {}
    m[type] = _count._all ?? 0
    countsByPost.set(postingId, m)
  }

  // 3) Viewer-Reaction (nur für eingeloggte Nutzer)
  const viewerByPost = new Map<string, string>()
  if (session) {
    const viewerReactions = await prisma.reaction.findMany({
      where: { postingId: { in: postIds }, userId: session.user.id },
      select: { postingId: true, type: true }
    })
    for (const r of viewerReactions) {
      if (r.postingId != null) viewerByPost.set(r.postingId, r.type)
    }
  }

  return {
    items: items.map((post) => {
      const countsMap = countsByPost.get(post.id) ?? {}
      const counts = REACTION_EMOJIS.map((emoji) => ({
        emoji,
        count: countsMap[emoji] ?? 0
      }))
      const viewerReaction = viewerByPost.get(post.id) ?? null

      return {
        id: post.id,
        createdAt: post.date.toISOString(),
        text: post.text ?? '',
        image: post.image ?? null,
        visibility: post.visibility,
        author: {
          id: post.user.id,
          name: post.user.name,
          nameId: post.user.nameId,
          image: post.user.image ?? null
        },
        runningExercise: post.runningExercise
          ? {
            distanceInMeters: post.runningExercise.distanceInMeters,
            durationInSeconds: post.runningExercise.durationInSeconds,
            source: post.runningExercise.source
          }
          : { distanceInMeters: null, durationInSeconds: null, source: null },
        reactions: counts,
        viewerReaction,
        comments: post.comments.map((c) => ({
          id: c.id,
          text: c.text,
          createdAt: c.date.toISOString(),
          author: {
            id: c.user.id,
            name: c.user.name,
            nameId: c.user.nameId,
            image: c.user.image ?? null
          }
        })),
        commentsTotal: post._count.comments
      }
    }),
    nextCursor,
    emojis: REACTION_EMOJIS
  }
})
