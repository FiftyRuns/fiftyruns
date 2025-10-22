import { eventHandler, getQuery } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'
import type { Prisma } from '@prisma/client'

const dateFormatter = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' })

export default eventHandler(async (event) => {
  const session = await resolveSession(event)

  const q = getQuery(event)
  const search = typeof q.search === 'string' ? q.search.trim() : ''
  const takeRaw = Number(q.take ?? 12)
  const take = Number.isFinite(takeRaw) ? Math.min(Math.max(Math.floor(takeRaw), 1), 50) : 12

  // Fix 1: Use Prisma's generated types for the where clause
  const where: Prisma.ChallengeWhereInput = {
    OR: session 
      ? [{ visibility: 'public' }, { visibility: 'protected' }]
      : [{ visibility: 'public' }],
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ] as Prisma.ChallengeWhereInput[],
    }),
  }

  // Fix 2: Get challenges and counts separately to avoid complex typing
  const challenges = await prisma.challenge.findMany({
    where,
    orderBy: [{ startAt: 'asc' }],
    take,
    select: {
      id: true,
      name: true,
      nameId: true,
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
      sponsorLogos: true,
      adminUserId: true,
    },
  })

  // Fix 3: Get member counts in a separate query
  const challengeIds = challenges.map(c => c.id)
  const memberCounts = await prisma.challengeMember.groupBy({
    by: ['challengeId'],
    _count: {
      userId: true
    },
    where: {
      challengeId: { in: challengeIds }
    }
  })

  // Fix 4: Get user memberships in a separate query
  let userMemberships: string[] = []
  if (session) {
    const userMemberRecords = await prisma.challengeMember.findMany({
      where: {
        userId: session.user.id,
        challengeId: { in: challengeIds }
      },
      select: { challengeId: true }
    })
    userMemberships = userMemberRecords.map(m => m.challengeId)
  }

  // Create lookup maps for efficient data access
  const countLookup = new Map(memberCounts.map(item => [item.challengeId, item._count.userId]))

  // Fix 5: Return properly typed response
  return challenges.map((challenge) => ({
    id: challenge.id,
    name: challenge.name,
    nameId: challenge.nameId,
    description: challenge.description ?? '',
    prize: challenge.prize ?? '',
    image: challenge.image ?? null,
    period: `${dateFormatter.format(challenge.startAt)} – ${dateFormatter.format(challenge.endAt)}`,
    goal: formatGoal(challenge),
    minRequirements: formatMinRequirements(challenge),
    sponsorLogos: challenge.sponsorLogos,
    participants: countLookup.get(challenge.id) ?? 0,
    isMember: userMemberships.includes(challenge.id),
  }))
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
      if (!meters) return 'Keine Distanzvorgabe'
      return `${(meters / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} km Gesamtziel`
    }
    case 'TIME': {
      const seconds = challenge.goalDurationSeconds ?? 0
      if (!seconds) return 'Kein Zeitziel'
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const remainingSeconds = seconds % 60
      const parts: string[] = []
      if (hours) parts.push(`${hours} h`)
      if (minutes) parts.push(`${minutes} min`)
      if (!hours && !minutes) parts.push(`${remainingSeconds} s`)
      return `Ziel: ${parts.join(' ')}`
    }
    case 'RUNS': {
      const runs = challenge.goalRuns ?? 0
      if (!runs) return 'Kein Laufziel'
      return `${runs} Läufe als Ziel`
    }
    default:
      return 'Kein Ziel definiert'
  }
}

function formatMinRequirements(challenge: {
  minDistanceMeters: number | null
  minDurationSeconds: number | null
}) {
  const parts: string[] = []
  if (challenge.minDistanceMeters != null && challenge.minDistanceMeters > 0) {
    parts.push(`mind. ${(challenge.minDistanceMeters / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} km`)
  }
  if (challenge.minDurationSeconds != null && challenge.minDurationSeconds > 0) {
    const minutes = Math.floor(challenge.minDurationSeconds / 60)
    parts.push(`mind. ${minutes} min`)
  }
  return parts.join(' · ')
}