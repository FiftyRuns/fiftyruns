import { createError, eventHandler } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'

const dateFormatter = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' })

export default eventHandler(async (event) => {
  const nameId = event.context.params?.nameId
  if (!nameId || typeof nameId !== 'string') {
    throw createError({ statusCode: 400, message: 'Challenge-Slug fehlt.' })
  }

  const session = await resolveSession(event)
  const userId = session?.user.id ?? null

  const challenge = await prisma.challenge.findUnique({
    where: { nameId },
    select: {
      id: true,
      name: true,
      description: true,
      prize: true,
      image: true,
      startAt: true,
      endAt: true,
      goalType: true,
      goalDistanceMeters: true,
      goalDurationSeconds: true,
      goalRuns: true,
      minDistanceMeters: true,
      minDurationSeconds: true,
      visibility: true,
      sponsorLogos: true,
      adminUserId: true,
      admin: {
        select: {
          id: true,
          name: true,
          nameId: true,
          image: true,
        },
      },
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

  const isAdmin = userId === challenge.adminUserId

  const membership = userId
    ? await prisma.challengeMember.findUnique({
        where: {
          challengeId_userId: {
            challengeId: challenge.id,
            userId,
          },
        },
        select: { id: true },
      })
    : null

  const leaderboard = await loadLeaderboard(challenge.id, challenge.goalType)
  const participants = await loadParticipants(challenge.id)

  return {
    challenge: {
      id: challenge.id,
      name: challenge.name,
      description: challenge.description ?? '',
      prize: challenge.prize ?? '',
      image: challenge.image ?? null,
      period: `${dateFormatter.format(challenge.startAt)} – ${dateFormatter.format(challenge.endAt)}`,
      startAt: challenge.startAt.toISOString(),
      endAt: challenge.endAt.toISOString(),
      goalType: challenge.goalType,
      goalLabel: buildGoalLabel(challenge),
      goalDistanceMeters: challenge.goalDistanceMeters,
      goalDurationSeconds: challenge.goalDurationSeconds,
      goalRuns: challenge.goalRuns,
      minRequirements: formatMinRequirements(challenge),
      minDistanceMeters: challenge.minDistanceMeters,
      minDurationSeconds: challenge.minDurationSeconds,
      visibility: challenge.visibility,
      sponsorLogos: challenge.sponsorLogos,
      admin: challenge.admin,
      team: challenge.group,
    },
    viewer: {
      isAdmin,
      isMember: Boolean(membership),
    },
    leaderboard,
    participants,
  }
})

async function loadLeaderboard(challengeId: string, goalType: string) {
  const orderBy = buildLeaderboardOrder(goalType)
  const rows = await prisma.challengeHighscore.findMany({
    where: { challengeId },
    orderBy,
    take: 25,
    select: {
      userId: true,
      runsCount: true,
      distanceInMeters: true,
      durationInSeconds: true,
      progressPercent: true,
      user: {
        select: {
          id: true,
          name: true,
          nameId: true,
          image: true,
        },
      },
    },
  })

  return rows.map((row) => ({
    user: row.user,
    runs: row.runsCount,
    distanceInMeters: row.distanceInMeters,
    durationInSeconds: row.durationInSeconds,
    progressPercent: row.progressPercent,
  }))
}

function buildLeaderboardOrder(goalType: string) {
  switch (goalType) {
    case 'DISTANCE':
      return [
        { distanceInMeters: 'desc' as const },
        { runsCount: 'desc' as const },
        { durationInSeconds: 'desc' as const },
        { updatedAt: 'asc' as const },
      ]
    case 'TIME':
      return [
        { durationInSeconds: 'desc' as const },
        { runsCount: 'desc' as const },
        { distanceInMeters: 'desc' as const },
        { updatedAt: 'asc' as const },
      ]
    default:
      return [
        { runsCount: 'desc' as const },
        { distanceInMeters: 'desc' as const },
        { durationInSeconds: 'desc' as const },
        { updatedAt: 'asc' as const },
      ]
  }
}

async function loadParticipants(challengeId: string) {
  const rows = await prisma.challengeMember.findMany({
    where: { challengeId },
    orderBy: { joinedAt: 'asc' },
    take: 50,
    select: {
      user: {
        select: {
          id: true,
          name: true,
          nameId: true,
          image: true,
        },
      },
      joinedAt: true,
    },
  })

  return rows.map((row) => ({
    user: row.user,
    joinedAt: row.joinedAt.toISOString(),
  }))
}

function buildGoalLabel(challenge: {
  goalType: string
  goalDistanceMeters: number | null
  goalDurationSeconds: number | null
  goalRuns: number | null
}) {
  switch (challenge.goalType) {
    case 'DISTANCE': {
      const meters = challenge.goalDistanceMeters ?? 0
      if (!meters) return 'Distanz-Ziel: offen'
      return `Ziel: ${(meters / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} km`
    }
    case 'TIME': {
      const seconds = challenge.goalDurationSeconds ?? 0
      if (!seconds) return 'Zeit-Ziel: offen'
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const parts: string[] = []
      if (hours) parts.push(`${hours} h`)
      if (minutes) parts.push(`${minutes} min`)
      if (!hours && !minutes) parts.push(`${seconds % 60} s`)
      return `Ziel: ${parts.join(' ')}`
    }
    case 'RUNS': {
      const runs = challenge.goalRuns ?? 0
      if (!runs) return 'Lauf-Ziel: offen'
      return `Ziel: ${runs} Läufe`
    }
    default:
      return 'Ziel: offen'
  }
}

function formatMinRequirements(challenge: {
  minDistanceMeters: number | null
  minDurationSeconds: number | null
}) {
  const parts: string[] = []
  if (challenge.minDistanceMeters != null && challenge.minDistanceMeters > 0) {
    parts.push(`mind. ${(challenge.minDistanceMeters / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} km pro Lauf`)
  }
  if (challenge.minDurationSeconds != null && challenge.minDurationSeconds > 0) {
    const minutes = Math.floor(challenge.minDurationSeconds / 60)
    parts.push(`mind. ${minutes} min pro Lauf`)
  }
  return parts.join(' · ')
}
