import { eventHandler, setResponseHeader } from 'h3'
import { prisma } from '../utils/prisma'
import { resolveSession } from '../utils/session'

const TOP_LIMIT = 5

type UserStatRecord = {
  userId: string
  numberOfRuns: number
  distanceInMeters: number
  durationInSeconds: number
  user: {
    name: string
    nameId: string
    image: string | null
  }
}

function mapEntry(entry: UserStatRecord) {
  return {
    id: entry.userId,
    name: entry.user.name,
    nameId: entry.user.nameId,
    image: entry.user.image,
    runs: entry.numberOfRuns,
    distanceInMeters: entry.distanceInMeters,
    durationInSeconds: entry.durationInSeconds,
  }
}

export default eventHandler(async (event) => {
  const session = await resolveSession(event)

  const cacheControl = session ? 'private, max-age=15, stale-while-revalidate=30' : 'public, max-age=15, stale-while-revalidate=30'
  setResponseHeader(event, 'Cache-Control', cacheControl)

  const selectFields = {
    userId: true,
    numberOfRuns: true,
    distanceInMeters: true,
    durationInSeconds: true,
    user: {
      select: {
        name: true,
        nameId: true,
        image: true,
      },
    },
  } as const

  const [runsTop, distanceTop, durationTop, donationsSum, membership] = await Promise.all([
    prisma.runningStatistic.findMany({
      where: { numberOfRuns: { gt: 0 } },
      orderBy: [{ numberOfRuns: 'desc' }, { user: { name: 'asc' } }],
      take: TOP_LIMIT,
      select: selectFields,
    }),
    prisma.runningStatistic.findMany({
      where: { distanceInMeters: { gt: 0 } },
      orderBy: [{ distanceInMeters: 'desc' }, { user: { name: 'asc' } }],
      take: TOP_LIMIT,
      select: selectFields,
    }),
    prisma.runningStatistic.findMany({
      where: { durationInSeconds: { gt: 0 } },
      orderBy: [{ durationInSeconds: 'desc' }, { user: { name: 'asc' } }],
      take: TOP_LIMIT,
      select: selectFields,
    }),
    prisma.donation.aggregate({ _sum: { amountInCent: true } }),
    session
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: { groupId: true },
        })
      : Promise.resolve(null),
  ])

  let teamTop: UserStatRecord[] | null = null
  if (membership?.groupId) {
    teamTop = await prisma.runningStatistic.findMany({
      where: {
        numberOfRuns: { gt: 0 },
        user: { groupId: membership.groupId },
      },
      orderBy: [{ numberOfRuns: 'desc' }, { user: { name: 'asc' } }],
      take: TOP_LIMIT,
      select: selectFields,
    })
  }

  const totalDonationsCent = donationsSum._sum.amountInCent ?? 0

  return {
    donations: {
      amountInCent: totalDonationsCent,
    },
    leaderboards: {
      runs: runsTop.map(mapEntry),
      distance: distanceTop.map(mapEntry),
      duration: durationTop.map(mapEntry),
    },
    team: teamTop ? teamTop.map(mapEntry) : null,
  }
})
