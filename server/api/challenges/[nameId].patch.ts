import { createError, eventHandler, readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'
import { assertCsrf } from '../../utils/csrf'
import { calculateChallengeProgress } from '../../utils/challengeProgress'

type Visibility = 'public' | 'protected' | 'private'

interface GoalPayload {
  type?: 'DISTANCE' | 'TIME' | 'RUNS'
  distanceMeters?: number | null
  durationSeconds?: number | null
  runs?: number | null
}

interface UpdateChallengeBody {
  name?: string
  description?: string | null
  prize?: string | null
  image?: string | null
  sponsorLogos?: string[]
  minDistanceMeters?: number | null
  minDurationSeconds?: number | null
  startAt?: string
  endAt?: string
  visibility?: Visibility
  goal?: GoalPayload
  teamId?: string | null
}

const ALLOWED_VISIBILITY: Visibility[] = ['public', 'protected', 'private']

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
      startAt: true,
      endAt: true,
      goalType: true,
      goalDistanceMeters: true,
      goalDurationSeconds: true,
      goalRuns: true,
      minDistanceMeters: true,
      minDurationSeconds: true,
      groupId: true,
    },
  })

  if (!challenge) {
    throw createError({ statusCode: 404, message: 'Challenge nicht gefunden.' })
  }

  if (challenge.adminUserId !== session.user.id) {
    throw createError({ statusCode: 403, message: 'Nur Admins dürfen die Challenge bearbeiten.' })
  }

  const body = (await readBody<UpdateChallengeBody>(event)) ?? {}

  const data: Record<string, unknown> = {}

  if (body.name) {
    const trimmedName = body.name.trim()
    if (trimmedName.length < 4) {
      throw createError({ statusCode: 400, message: 'Name ist zu kurz.' })
    }
    data.name = trimmedName
  }

  if ('description' in body) {
    data.description = body.description ? body.description.trim() : null
  }

  if ('prize' in body) {
    data.prize = body.prize ? body.prize.trim() : null
  }

  if ('image' in body) {
    data.image = sanitizeUrl(body.image)
  }

  if (body.sponsorLogos) {
    data.sponsorLogos = body.sponsorLogos
      .filter((entry) => typeof entry === 'string' && entry.trim().length > 0)
      .slice(0, 8)
  }

  if ('minDistanceMeters' in body) {
    data.minDistanceMeters = body.minDistanceMeters != null ? asPositiveInt(body.minDistanceMeters) : null
  }

  if ('minDurationSeconds' in body) {
    data.minDurationSeconds = body.minDurationSeconds != null ? asPositiveInt(body.minDurationSeconds) : null
  }

  let startAt = challenge.startAt
  let endAt = challenge.endAt

  if (body.startAt) {
    const parsed = new Date(body.startAt)
    if (Number.isNaN(parsed.getTime())) {
      throw createError({ statusCode: 400, message: 'Ungültiges Startdatum.' })
    }
    startAt = parsed
  }

  if (body.endAt) {
    const parsed = new Date(body.endAt)
    if (Number.isNaN(parsed.getTime())) {
      throw createError({ statusCode: 400, message: 'Ungültiges Enddatum.' })
    }
    endAt = parsed
  }

  if (startAt && endAt && endAt <= startAt) {
    throw createError({ statusCode: 400, message: 'Enddatum muss nach dem Startdatum liegen.' })
  }

  if (body.startAt || body.endAt) {
    data.startAt = startAt
    data.endAt = endAt
  }

  if (body.visibility && ALLOWED_VISIBILITY.includes(body.visibility)) {
    data.visibility = body.visibility
  }

  let goalChanged = false

  if (body.goal) {
    const updateGoal = resolveGoalUpdate(body.goal, challenge)
    data.goalType = updateGoal.goalType
    data.goalDistanceMeters = updateGoal.goalDistanceMeters
    data.goalDurationSeconds = updateGoal.goalDurationSeconds
    data.goalRuns = updateGoal.goalRuns
    goalChanged = true
  }

  let groupIdUpdate: string | null | undefined = undefined
  if (body.teamId !== undefined) {
    if (!body.teamId) {
      groupIdUpdate = null
    } else {
      const group = await prisma.group.findFirst({
        where: {
          id: body.teamId,
          users: { some: { id: session.user.id, groupRole: 'ADMIN' } },
        },
        select: { id: true },
      })
      if (!group) {
        throw createError({ statusCode: 403, message: 'Du kannst diese Challenge nicht diesem Team zuordnen.' })
      }
      groupIdUpdate = group.id
    }
  }

  if (Object.keys(data).length === 0 && !goalChanged && groupIdUpdate === undefined) {
    throw createError({ statusCode: 400, message: 'Keine Änderungen übermittelt.' })
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedChallenge = await tx.challenge.update({
      where: { id: challenge.id },
      data: {
        ...data,
        ...(groupIdUpdate !== undefined ? { groupId: groupIdUpdate } : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        prize: true,
        image: true,
        startAt: true,
        endAt: true,
        visibility: true,
        sponsorLogos: true,
        minDistanceMeters: true,
        minDurationSeconds: true,
        goalType: true,
        goalDistanceMeters: true,
        goalDurationSeconds: true,
        goalRuns: true,
        groupId: true,
      },
    })

    if (goalChanged) {
      const highscores = await tx.challengeHighscore.findMany({ where: { challengeId: challenge.id } })
      if (highscores.length) {
        const rules = {
          id: updatedChallenge.id,
          goalType: updatedChallenge.goalType,
          goalDistanceMeters: updatedChallenge.goalDistanceMeters,
          goalDurationSeconds: updatedChallenge.goalDurationSeconds,
          goalRuns: updatedChallenge.goalRuns,
          minDistanceMeters: updatedChallenge.minDistanceMeters,
          minDurationSeconds: updatedChallenge.minDurationSeconds,
        }
        for (const entry of highscores) {
          const progress = calculateChallengeProgress(
            rules,
            entry.runsCount,
            entry.distanceInMeters,
            entry.durationInSeconds,
          )
          await tx.challengeHighscore.update({
            where: { id: entry.id },
            data: { progressPercent: progress },
          })
        }
      }
    }

    return updatedChallenge
  })

  return updated
})

function asPositiveInt(value: unknown): number | null {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return null
  return Math.round(num)
}

function sanitizeUrl(value: string | null | undefined) {
  if (!value) return null
  try {
    const url = new URL(value)
    if (!/^https?:/.test(url.protocol)) return null
    return url.toString()
  } catch {
    return null
  }
}

function resolveGoalUpdate(goal: GoalPayload, challenge: {
  goalType: 'DISTANCE' | 'TIME' | 'RUNS'
  goalDistanceMeters: number | null
  goalDurationSeconds: number | null
  goalRuns: number | null
}) {
  const nextType = goal.type ?? challenge.goalType

  if (!['DISTANCE', 'TIME', 'RUNS'].includes(nextType)) {
    throw createError({ statusCode: 400, message: 'Ungültiger Zieltyp.' })
  }

  if (nextType === 'DISTANCE') {
    const distance = asPositiveInt(goal.distanceMeters)
    if (!distance) {
      throw createError({ statusCode: 400, message: 'Bitte ein Distanz-Ziel angeben.' })
    }
    return {
      goalType: nextType,
      goalDistanceMeters: distance,
      goalDurationSeconds: null,
      goalRuns: null,
    }
  }

  if (nextType === 'TIME') {
    const duration = asPositiveInt(goal.durationSeconds)
    if (!duration) {
      throw createError({ statusCode: 400, message: 'Bitte ein Zeit-Ziel angeben.' })
    }
    return {
      goalType: nextType,
      goalDistanceMeters: null,
      goalDurationSeconds: duration,
      goalRuns: null,
    }
  }

  const runs = asPositiveInt(goal.runs)
  if (!runs) {
    throw createError({ statusCode: 400, message: 'Bitte ein Lauf-Ziel angeben.' })
  }
  return {
    goalType: nextType,
    goalDistanceMeters: null,
    goalDurationSeconds: null,
    goalRuns: runs,
  }
}
