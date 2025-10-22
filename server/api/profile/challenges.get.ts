import { createError, eventHandler } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'

const dateFormatter = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' })

export default eventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const userId = session.user.id

  const rows = await prisma.challenge.findMany({
    where: {
      OR: [
        { adminUserId: userId },
        { members: { some: { userId } } },
      ],
    },
    orderBy: [{ startAt: 'asc' }],
    select: {
      id: true,
      name: true,
      nameId: true,
      description: true,
      startAt: true,
      endAt: true,
      goalType: true,
      goalDistanceMeters: true,
      goalDurationSeconds: true,
      goalRuns: true,
      minDistanceMeters: true,
      minDurationSeconds: true,
      adminUserId: true,
      _count: { select: { members: true } },
    },
  })

  const seen = new Set<string>()
  const challenges = []

  for (const row of rows) {
    if (seen.has(row.id)) continue
    seen.add(row.id)

    challenges.push({
      id: row.id,
      name: row.name,
      nameId: row.nameId,
      description: row.description ?? '',
      period: `${dateFormatter.format(row.startAt)} – ${dateFormatter.format(row.endAt)}`,
      goal: formatGoal(row),
      participants: row._count.members,
      isAdmin: row.adminUserId === userId,
      minRequirements: formatMinRequirements(row),
    })
  }

  return challenges
})

function formatGoal(challenge: {
  goalType: string
  goalDistanceMeters: number | null
  goalDurationSeconds: number | null
  goalRuns: number | null
}) {
  switch (challenge.goalType) {
    case 'DISTANCE': {
      const meters = challenge.goalDistanceMeters ?? 0
      if (!meters) return 'Kein Distanz-Ziel'
      return `${(meters / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} km Ziel`
    }
    case 'TIME': {
      const seconds = challenge.goalDurationSeconds ?? 0
      if (!seconds) return 'Kein Zeit-Ziel'
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const parts = []
      if (hours) parts.push(`${hours} h`)
      if (minutes) parts.push(`${minutes} min`)
      if (!parts.length) parts.push(`${seconds} s`)
      return `Ziel: ${parts.join(' ')}`
    }
    case 'RUNS': {
      const runs = challenge.goalRuns ?? 0
      if (!runs) return 'Kein Lauf-Ziel'
      return `${runs} Läufe Ziel`
    }
    default:
      return 'Kein Ziel definiert'
  }
}

function formatMinRequirements(challenge: {
  minDistanceMeters: number | null
  minDurationSeconds: number | null
}) {
  const requirements: string[] = []
  if (challenge.minDistanceMeters != null && challenge.minDistanceMeters > 0) {
    requirements.push(`mind. ${(challenge.minDistanceMeters / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} km pro Lauf`)
  }
  if (challenge.minDurationSeconds != null && challenge.minDurationSeconds > 0) {
    const minutes = Math.floor(challenge.minDurationSeconds / 60)
    requirements.push(`mind. ${minutes} min pro Lauf`)
  }
  return requirements.join(' · ')
}
