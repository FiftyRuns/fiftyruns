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

  const nameId = event.context.params?.nameId
  if (!nameId || typeof nameId !== 'string') {
    throw createError({ statusCode: 400, message: 'Challenge-Slug fehlt.' })
  }

  const challenge = await prisma.challenge.findUnique({
    where: { nameId },
    select: {
      id: true,
      visibility: true,
      endAt: true,
      adminUserId: true,
      groupId: true,
      group: {
        select: {
          id: true,
          name: true,
          nameId: true,
        },
      },
    },
  })

  if (!challenge) {
    throw createError({ statusCode: 404, message: 'Challenge nicht gefunden.' })
  }

  if (challenge.visibility === 'private' && challenge.adminUserId !== session.user.id) {
    throw createError({ statusCode: 403, message: 'Diese Challenge kann nur auf Einladung beigetreten werden.' })
  }

  if (challenge.endAt < new Date()) {
    throw createError({ statusCode: 400, message: 'Diese Challenge ist bereits beendet.' })
  }

  if (challenge.groupId) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { groupId: true },
    })

    const belongsToTeam = user?.groupId === challenge.groupId
    const isChallengeOwner = challenge.adminUserId === session.user.id

    if (!belongsToTeam && !isChallengeOwner) {
      const teamName = challenge.group?.name ?? 'diesem Team'
      throw createError({
        statusCode: 403,
        message: `Diese Challenge ist dem Team „${teamName}” vorbehalten. Tritt dem Team bei, um teilzunehmen.`,
      })
    }
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.challengeMember.findUnique({
      where: {
        challengeId_userId: {
          challengeId: challenge.id,
          userId: session.user.id,
        },
      },
      select: { id: true },
    })

    if (existing) {
      throw createError({ statusCode: 400, message: 'Du bist bereits in dieser Challenge.' })
    }

    await tx.challengeMember.create({
      data: {
        challengeId: challenge.id,
        userId: session.user.id,
      },
    })

    await tx.challengeHighscore.upsert({
      where: {
        challengeId_userId: {
          challengeId: challenge.id,
          userId: session.user.id,
        },
      },
      update: {},
      create: {
        challengeId: challenge.id,
        userId: session.user.id,
      },
    })
  })

  return { ok: true }
})
