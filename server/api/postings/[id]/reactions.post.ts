// server/api/postings/[id]/reactions.post.ts
import { NotificationCategory } from '@prisma/client'
import { createError, eventHandler, readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { resolveSession } from '../../../utils/session'
import { assertCsrf } from '../../../utils/csrf'
import { createNotification } from '../../../utils/notifications'
import { REACTION_EMOJIS } from '@/constants/reactions'

type ReactionBody = {
  emoji?: string | null
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

  const body = (await readBody<ReactionBody>(event)) || {}
  const emoji = typeof body.emoji === 'string' ? body.emoji : null

  if (emoji && !REACTION_EMOJIS.includes(emoji as (typeof REACTION_EMOJIS)[number])) {
    throw createError({ statusCode: 400, message: 'Unbekannte Reaktion.' })
  }

  const post = await prisma.posting.findUnique({
    where: { id },
    select: {
      id: true,
      visibility: true,
      text: true,
      userId: true,
      user: {
        select: {
          id: true,
          name: true,
          nameId: true,
          image: true,
          notificationsEnabled: true,
        },
      },
    },
  })

  if (!post) {
    throw createError({ statusCode: 404, message: 'Beitrag nicht gefunden.' })
  }

  if (post.visibility === 'private' && post.userId !== session.user.id) {
    throw createError({ statusCode: 403, message: 'Dieser Beitrag ist privat.' })
  }

  const existing = await prisma.reaction.findUnique({
    where: {
      userId_postingId: {
        userId: session.user.id,
        postingId: post.id,
      },
    },
  })

  let createdOrChanged = false

  if (!emoji) {
    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } })
    }
  } else if (!existing) {
    await prisma.reaction.create({
      data: {
        postingId: post.id,
        userId: session.user.id,
        type: emoji,
      },
    })
    createdOrChanged = true
  } else if (existing.type === emoji) {
    await prisma.reaction.delete({ where: { id: existing.id } })
  } else {
    await prisma.reaction.update({
      where: { id: existing.id },
      data: { type: emoji },
    })
    createdOrChanged = true
  }

  const [reactionCounts, viewerReactionResult] = await Promise.all([
    prisma.reaction.groupBy({
      by: ['type'],
      where: { postingId: post.id },
      _count: { _all: true },
    }),
    prisma.reaction.findUnique({
      where: { userId_postingId: { userId: session.user.id, postingId: post.id } },
      select: { type: true },
    }),
  ])

  const countMap = new Map(reactionCounts.map(r => [r.type, r._count._all]))
  const counts = REACTION_EMOJIS.map((value) => ({
    emoji: value,
    count: countMap.get(value) ?? 0,
  }))

  const viewerReaction = viewerReactionResult?.type ?? null

  if (
    createdOrChanged &&
    emoji &&
    post.userId !== session.user.id &&
    post.user?.notificationsEnabled
  ) {
    await createNotification(prisma, {
      userId: post.userId,
      category: NotificationCategory.REACTION,
      type: 'reaction.added',
      title: 'Neue Reaktion auf deinen Beitrag',
      message: `${session.user.name} hat mit ${emoji} auf deinen Beitrag reagiert.`,
      link: `/postings/${post.id}`,
      data: {
        emoji,
        postingId: post.id,
        postingPreview: (post.text ?? '').slice(0, 140),
        actor: {
          id: session.user.id,
          name: session.user.name,
          nameId: session.user.nameId,
          image: session.user.image ?? null,
        },
      },
    })
  }

  return { reactions: counts, viewerReaction }
})
