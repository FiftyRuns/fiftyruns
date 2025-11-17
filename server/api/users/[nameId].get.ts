import { createError, eventHandler } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'

const CURRENT_SEASON = String(new Date().getFullYear())

export default eventHandler(async (event) => {
  const session = await resolveSession(event)

  const nameIdParam = event.context.params?.nameId
  if (!nameIdParam || typeof nameIdParam !== 'string') {
    throw createError({ statusCode: 400, message: 'Profil-Identifier fehlt.' })
  }

  const user = await prisma.user.findUnique({
    where: { nameId: nameIdParam },
    select: {
      id: true,
      name: true,
      nameId: true,
      image: true,
      bio: true,
      groupRole: true,
      group: {
        select: {
          id: true,
          name: true,
          nameId: true,
        },
      },
    },
  })

  if (!user) {
    throw createError({ statusCode: 404, message: 'Nutzer:in nicht gefunden.' })
  }

  const stat = await prisma.runningStatistic.findUnique({
    where: { userId: user.id },
  })

  let runs = 0
  let distance = 0
  let duration = 0

  if (stat && stat.season === CURRENT_SEASON) {
    runs = stat.numberOfRuns
    distance = stat.distanceInMeters
    duration = stat.durationInSeconds
  } else {
    const aggregation = await prisma.runningExercise.aggregate({
      _sum: {
        distanceInMeters: true,
        durationInSeconds: true,
      },
      _count: { _all: true },
      where: { posting: { userId: user.id, season: CURRENT_SEASON } },
    })

    runs = aggregation._count._all ?? 0
    distance = aggregation._sum.distanceInMeters ?? 0
    duration = aggregation._sum.durationInSeconds ?? 0
  }

  const donationSum = await prisma.donation.aggregate({
    _sum: { amountInCent: true },
    where: { posting: { userId: user.id } },
  })

  const visibility: Array<'public' | 'protected' | 'private'> = ['public']
  if (session) {
    visibility.push('protected')
  }
  if (session?.user.id === user.id) {
    visibility.push('private')
  }

  const posts = await prisma.posting.findMany({
    where: {
      userId: user.id,
      visibility: { in: visibility },
    },
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
    take: 5,
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

  return {
    user: {
      id: user.id,
      name: user.name,
      nameId: user.nameId,
      image: user.image ?? null,
      bio: user.bio ?? '',
      group: user.group
        ? {
            id: user.group.id,
            name: user.group.name,
            nameId: user.group.nameId,
            role: user.groupRole,
          }
        : null,
    },
    stats: {
      season: CURRENT_SEASON,
      runs,
      distanceInMeters: distance,
      durationInSeconds: duration,
    },
    donations: {
      amountInCent: donationSum._sum.amountInCent ?? 0,
    },
    posts: posts.map((post) => ({
      id: post.id,
      createdAt: post.date.toISOString(),
      text: post.text ?? '',
      visibility: post.visibility,
      image: post.image ?? null,
      runningExercise: {
        distanceInMeters: post.runningExercise?.distanceInMeters ?? null,
        durationInSeconds: post.runningExercise?.durationInSeconds ?? null,
        source: post.runningExercise?.source ?? null,
      },
    })),
    isSelf: session?.user.id === user.id,
  }
})
