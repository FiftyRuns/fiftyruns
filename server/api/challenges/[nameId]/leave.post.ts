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
      adminUserId: true,
    },
  })

  if (!challenge) {
    throw createError({ statusCode: 404, message: 'Challenge nicht gefunden.' })
  }

  if (challenge.adminUserId === session.user.id) {
    throw createError({ statusCode: 400, message: 'Admins können die eigene Challenge nicht verlassen.' })
  }

  const membership = await prisma.challengeMember.findUnique({
    where: {
      challengeId_userId: {
        challengeId: challenge.id,
        userId: session.user.id,
      },
    },
    select: { id: true },
  })

  if (!membership) {
    throw createError({ statusCode: 400, message: 'Du bist kein Mitglied dieser Challenge.' })
  }

  await prisma.$transaction(async (tx) => {
    await tx.challengeMember.delete({ where: { id: membership.id } })
    await tx.challengeHighscore.deleteMany({
      where: {
        challengeId: challenge.id,
        userId: session.user.id,
      },
    })
  })

  return { ok: true }
})
