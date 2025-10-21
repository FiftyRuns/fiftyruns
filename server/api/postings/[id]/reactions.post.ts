// server/api/postings/[id]/reactions.post.ts
import { createError, eventHandler, readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { resolveSession } from '../../../utils/session'
import { assertCsrf } from '../../../utils/csrf'
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
    select: { id: true, visibility: true, userId: true },
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
  } else if (existing.type === emoji) {
    await prisma.reaction.delete({ where: { id: existing.id } })
  } else {
    await prisma.reaction.update({
      where: { id: existing.id },
      data: { type: emoji },
    })
  }

  const reactions = await prisma.reaction.findMany({
    where: { postingId: post.id },
    select: { type: true, userId: true },
  })

  const counts = REACTION_EMOJIS.map((value) => ({
    emoji: value,
    count: reactions.filter((reaction) => reaction.type === value).length,
  }))

  const viewerReaction =
    reactions.find((reaction) => reaction.userId === session.user.id)?.type ?? null

  return { reactions: counts, viewerReaction }
})
