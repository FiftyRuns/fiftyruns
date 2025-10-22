import type { Prisma, ChallengeGoalType } from '@prisma/client'

type TransactionClient = Prisma.TransactionClient

export interface RunSnapshot {
  distanceInMeters: number | null
  durationInSeconds: number | null
}

interface UpdateChallengeParams {
  userId: string
  runDate: Date
  previous: RunSnapshot | null
  next: RunSnapshot | null
}

interface ChallengeWithRules {
  id: string
  goalType: ChallengeGoalType
  goalDistanceMeters: number | null
  goalDurationSeconds: number | null
  goalRuns: number | null
  minDistanceMeters: number | null
  minDurationSeconds: number | null
}

interface Contribution {
  runs: number
  distance: number
  duration: number
}

export async function updateChallengesForRun(tx: TransactionClient, params: UpdateChallengeParams) {
  const { userId, runDate, previous, next } = params

  const memberships = await tx.challengeMember.findMany({
    where: {
      userId,
      challenge: {
        startAt: { lte: runDate },
        endAt: { gte: runDate },
      },
    },
    select: {
      challengeId: true,
      challenge: {
        select: {
          id: true,
          goalType: true,
          goalDistanceMeters: true,
          goalDurationSeconds: true,
          goalRuns: true,
          minDistanceMeters: true,
          minDurationSeconds: true,
        },
      },
    },
  })

  if (memberships.length === 0) return

  const challengeIds = memberships.map((m) => m.challengeId)
  const highscores = await tx.challengeHighscore.findMany({
    where: { challengeId: { in: challengeIds }, userId },
  })
  const highscoreMap = new Map(highscores.map((entry) => [entry.challengeId, entry]))

  for (const membership of memberships) {
    const challenge = membership.challenge as ChallengeWithRules
    const prevQualifies = qualifies(challenge, previous)
    const nextQualifies = qualifies(challenge, next)

    if (!prevQualifies && !nextQualifies && !highscoreMap.has(challenge.id)) {
      continue
    }

    const prevContribution = buildContribution(prevQualifies ? previous : null)
    const nextContribution = buildContribution(nextQualifies ? next : null)

    const existing = highscoreMap.get(challenge.id)

    const currentRuns = existing?.runsCount ?? 0
    const currentDistance = existing?.distanceInMeters ?? 0
    const currentDuration = existing?.durationInSeconds ?? 0

    const updatedRuns = clampNonNegative(currentRuns - prevContribution.runs + nextContribution.runs)
    const updatedDistance = clampNonNegative(currentDistance - prevContribution.distance + nextContribution.distance)
    const updatedDuration = clampNonNegative(currentDuration - prevContribution.duration + nextContribution.duration)

    const progress = calculateChallengeProgress(challenge, updatedRuns, updatedDistance, updatedDuration)

    if (existing) {
      if (updatedRuns === 0 && updatedDistance === 0 && updatedDuration === 0) {
        await tx.challengeHighscore.delete({ where: { id: existing.id } })
        highscoreMap.delete(challenge.id)
      } else {
        const updated = await tx.challengeHighscore.update({
          where: { id: existing.id },
          data: {
            runsCount: updatedRuns,
            distanceInMeters: updatedDistance,
            durationInSeconds: updatedDuration,
            progressPercent: progress,
          },
        })
        highscoreMap.set(challenge.id, updated)
      }
    } else if (updatedRuns > 0 || updatedDistance > 0 || updatedDuration > 0) {
      const created = await tx.challengeHighscore.create({
        data: {
          challengeId: challenge.id,
          userId,
          runsCount: updatedRuns,
          distanceInMeters: updatedDistance,
          durationInSeconds: updatedDuration,
          progressPercent: progress,
        },
      })
      highscoreMap.set(challenge.id, created)
    }
  }
}

function qualifies(challenge: ChallengeWithRules, snapshot: RunSnapshot | null): boolean {
  if (!snapshot) return false

  const distance = snapshot.distanceInMeters ?? 0
  const duration = snapshot.durationInSeconds ?? 0

  if (challenge.minDistanceMeters != null && distance < challenge.minDistanceMeters) return false
  if (challenge.minDurationSeconds != null && duration < challenge.minDurationSeconds) return false

  return true
}

function buildContribution(snapshot: RunSnapshot | null): Contribution {
  if (!snapshot) return { runs: 0, distance: 0, duration: 0 }

  const distance = snapshot.distanceInMeters ?? 0
  const duration = snapshot.durationInSeconds ?? 0

  return {
    runs: 1,
    distance,
    duration,
  }
}

export function calculateChallengeProgress(
  challenge: ChallengeWithRules,
  runs: number,
  distance: number,
  duration: number,
): number {
  let goal = 0
  let current = 0

  switch (challenge.goalType) {
    case 'DISTANCE':
      goal = challenge.goalDistanceMeters ?? 0
      current = distance
      break
    case 'TIME':
      goal = challenge.goalDurationSeconds ?? 0
      current = duration
      break
    case 'RUNS':
      goal = challenge.goalRuns ?? 0
      current = runs
      break
    default:
      goal = 0
      current = 0
  }

  if (!goal || goal <= 0) return 0
  return Math.max(0, Math.min(100, Math.floor((current / goal) * 100)))
}

function clampNonNegative(value: number): number {
  return value < 0 ? 0 : value
}
