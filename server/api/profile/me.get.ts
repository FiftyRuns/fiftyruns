import { createError, eventHandler } from 'h3'
import { prisma } from '../../utils/prisma'

const DONATION_MULTIPLIER_TO_AMOUNT: Record<string, number> = {
  x1: 1,
  x2: 2,
  x5: 5,
  x10: 10,
}

export default eventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const userRecord = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: {
      id: true,
      name: true,
      nameId: true,
      email: true,
      image: true,
      bio: true,
      profileVisibility: true,
      notificationsEnabled: true,
      autoDonate: true,
      donationUpdatedAt: true,
      runDonationMultiplier: true,
      runningStatistic: {
        select: {
          distanceInMeters: true,
          durationInSeconds: true,
          numberOfRuns: true,
        },
      },
      group: {
        select: {
          id: true,
          name: true,
          nameId: true,
          users: {
            select: { id: true },
          },
        },
      },
    },
  })

  if (!userRecord) {
    throw createError({ statusCode: 404, message: 'Profil nicht gefunden.' })
  }

  const [postsData, challengesData] = await Promise.all([
    prisma.posting.findMany({
      where: { userId: userRecord.id },
      orderBy: { date: 'desc' },
      take: 20,
      select: {
        id: true,
        text: true,
        date: true,
        visibility: true,
        _count: { select: { reactions: true, comments: true } },
      },
    }),
    prisma.challenge.findMany({
      where: { adminUserId: userRecord.id },
      orderBy: { startAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        description: true,
        startAt: true,
        endAt: true,
        goalType: true,
        goalDistanceMeters: true,
        goalDurationSeconds: true,
        goalRuns: true,
        _count: { select: { members: true } },
      },
    }),
  ])

  const donationMultiplier = userRecord.runDonationMultiplier ?? null
  const donationAmount = donationMultiplier ? DONATION_MULTIPLIER_TO_AMOUNT[donationMultiplier] ?? 0 : 0

  return {
    user: {
      id: userRecord.id,
      name: userRecord.name,
      nameId: userRecord.nameId,
      email: userRecord.email,
      image: userRecord.image,
    },
    stats: {
      totalDistanceMeters: userRecord.runningStatistic?.distanceInMeters ?? 0,
      totalDurationSeconds: userRecord.runningStatistic?.durationInSeconds ?? 0,
      totalRuns: userRecord.runningStatistic?.numberOfRuns ?? 0,
    },
    posts: postsData.map((post) => ({
      id: post.id,
      text: post.text,
      createdAt: post.date.toISOString(),
      visibility: post.visibility,
      reactions: post._count.reactions,
      comments: post._count.comments,
    })),
    challenges: challengesData.map((challenge) => ({
      id: challenge.id,
      name: challenge.name,
      description: challenge.description,
      startAt: challenge.startAt.toISOString(),
      endAt: challenge.endAt.toISOString(),
      goalType: challenge.goalType,
      goalDistanceMeters: challenge.goalDistanceMeters,
      goalDurationSeconds: challenge.goalDurationSeconds,
      goalRuns: challenge.goalRuns,
      participants: challenge._count.members,
    })),
    team: userRecord.group
      ? {
          id: userRecord.group.id,
          name: userRecord.group.name,
          members: userRecord.group.users.length,
        }
      : null,
    donation: {
      amount: donationAmount,
      multiplier: donationMultiplier,
      autoDonate: userRecord.autoDonate ?? false,
      updatedAt: userRecord.donationUpdatedAt?.toISOString() ?? null,
    },
    settings: {
      bio: userRecord.bio,
      visibility: userRecord.profileVisibility,
      notifications: userRecord.notificationsEnabled,
      updatedAt: null as string | null,
    },
  }
})
