import { ActivitySource, Prisma, Visibility } from '@prisma/client'
import type { StravaWebhookEvent as PrismaStravaEvent } from '@prisma/client'
import { prisma } from './prisma'
import {
  STRAVA_SUPPORTED_SPORT_TYPES,
  ensureStravaAccessToken,
  fetchStravaActivity,
  getStravaWebhookConfig,
  mapStravaVisibility,
} from './strava'
import { updateChallengesForRun, type RunSnapshot } from './challengeProgress'

type TransactionClient = Prisma.TransactionClient

const RUN_VISIBILITY_MAP: Record<string, Visibility> = {
  public: 'public',
  protected: 'protected',
  private: 'private',
}

const DEFAULT_VISIBILITY: Visibility = 'private'

export async function processStravaWebhookEvent(eventId: string) {
  const eventRecord = await prisma.stravaWebhookEvent.findUnique({ where: { id: eventId } })
  if (!eventRecord || eventRecord.processedAt) return

  try {
    if (eventRecord.subscriptionId != null) {
      try {
        const webhookConfig = getStravaWebhookConfig()
        await prisma.stravaWebhookSubscription.upsert({
          where: { stravaSubscriptionId: eventRecord.subscriptionId },
          update: { active: true },
          create: {
            stravaSubscriptionId: eventRecord.subscriptionId,
            callbackUrl: webhookConfig.callbackUrl,
            verifyToken: webhookConfig.verifyToken,
            active: true,
          },
        })
      } catch (err) {
        if (process.dev) {
          console.warn('[strava-webhook] Subscription sync fehlgeschlagen', err)
        }
      }
    }

    if (eventRecord.objectType === 'athlete') {
      await handleAthleteEvent(eventRecord)
      await markEventProcessed(eventRecord.id)
      return
    }

    if (eventRecord.objectType === 'activity') {
      await handleActivityEvent(eventRecord)
      await markEventProcessed(eventRecord.id)
      return
    }

    await markEventProcessed(eventRecord.id)
  } catch (err) {
    if (process.dev) {
      console.error('[strava-webhook] Verarbeitung fehlgeschlagen', err)
    }
  }
}

async function handleAthleteEvent(event: PrismaStravaEvent) {
  if (!event.ownerId) return

  const updates = (event.updates ?? {}) as Record<string, unknown>
  const authorizedFlag = updates?.authorized

  if (authorizedFlag !== false && String(authorizedFlag ?? '').toLowerCase() !== 'false') {
    return
  }

  await prisma.user.updateMany({
    where: { stravaAthleteId: String(event.ownerId) },
    data: {
      stravaAccessToken: null,
      stravaRefreshToken: null,
      stravaTokenExpiresAt: null,
      stravaScopes: [],
      stravaConnectedAt: null,
      stravaDeauthorizedAt: new Date(),
    },
  })
}

async function handleActivityEvent(event: PrismaStravaEvent) {
  if (!event.objectId || !event.ownerId) return

  const user = await prisma.user.findFirst({
    where: { stravaAthleteId: String(event.ownerId) },
    select: {
      id: true,
      name: true,
      stravaAccessToken: true,
      stravaRefreshToken: true,
      stravaTokenExpiresAt: true,
    },
  })

  if (!user) return

  const activityId = String(event.objectId)
  const aspectType = String(event.aspectType || '').toLowerCase()

  if (aspectType === 'delete') {
    await deleteActivity(user.id, activityId)
    return
  }

  if (aspectType !== 'create' && aspectType !== 'update') {
    return
  }

  const accessToken = await ensureStravaAccessToken({
    id: user.id,
    stravaAccessToken: user.stravaAccessToken,
    stravaRefreshToken: user.stravaRefreshToken,
    stravaTokenExpiresAt: user.stravaTokenExpiresAt,
  })

  const activity = await fetchStravaActivity(accessToken, activityId)
  const sportType = activity.sport_type ?? ''

  if (!STRAVA_SUPPORTED_SPORT_TYPES.has(sportType)) {
    return
  }

  const distance = Math.round(activity.distance ?? 0)
  const duration = Math.round(activity.moving_time ?? activity.elapsed_time ?? 0)
  const runDate = parseActivityDate(activity)
  const season = `${runDate.getFullYear()}`
  const visibility = RUN_VISIBILITY_MAP[mapStravaVisibility(activity)] ?? DEFAULT_VISIBILITY

  await prisma.$transaction(async (tx) => {
    const existing = await tx.runningExercise.findUnique({
      where: { stravaActivityId: activityId },
      include: { posting: true },
    })

    const nextSnapshot: RunSnapshot = {
      distanceInMeters: distance,
      durationInSeconds: duration,
    }

    if (!existing) {
      await createNewStravaRun(tx, {
        userId: user.id,
        activity,
        activityId,
        distance,
        duration,
        runDate,
        season,
        visibility,
      })
      await markStatistics(tx, user.id, season, null, nextSnapshot)
      await updateChallengesForRun(tx, {
        userId: user.id,
        runDate,
        previous: null,
        next: nextSnapshot,
      })
      return
    }

    const previousSnapshot: RunSnapshot = {
      distanceInMeters: existing.distanceInMeters,
      durationInSeconds: existing.durationInSeconds,
    }

    await updateExistingStravaRun(tx, {
      existing,
      activity,
      distance,
      duration,
      runDate,
      season,
      visibility,
    })

    await markStatistics(tx, user.id, season, previousSnapshot, nextSnapshot)
    await updateChallengesForRun(tx, {
      userId: user.id,
      runDate,
      previous: previousSnapshot,
      next: nextSnapshot,
    })
  })
}

async function deleteActivity(userId: string, activityId: string) {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.runningExercise.findUnique({
      where: { stravaActivityId: activityId },
      include: { posting: true },
    })

    if (!existing) return

    const runDate = existing.posting?.date ?? new Date()
    const season = `${runDate.getFullYear()}`

    const previousSnapshot: RunSnapshot = {
      distanceInMeters: existing.distanceInMeters,
      durationInSeconds: existing.durationInSeconds,
    }

    await tx.posting.delete({ where: { id: existing.postingId } })
    await tx.runningExercise.delete({ where: { id: existing.id } })

    await markStatistics(tx, userId, season, previousSnapshot, null)
    await updateChallengesForRun(tx, {
      userId,
      runDate,
      previous: previousSnapshot,
      next: null,
    })
  })
}

async function createNewStravaRun(
  tx: TransactionClient,
  params: {
    userId: string
    activity: import('./strava').StravaActivity
    activityId: string
    distance: number
    duration: number
    runDate: Date
    season: string
    visibility: Visibility
  },
) {
  const { userId, activity, activityId, distance, duration, runDate, season, visibility } = params
  const title = (activity.name ?? 'Strava Lauf').trim()

  const posting = await tx.posting.create({
    data: {
      userId,
      date: runDate,
      text: title,
      visibility,
      season,
    },
    select: { id: true },
  })

  const runningExercise = await tx.runningExercise.create({
    data: {
      postingId: posting.id,
      distanceInMeters: distance,
      durationInSeconds: duration,
      stravaActivityId: activityId,
      source: ActivitySource.STRAVA,
    },
  })

  await tx.posting.update({
    where: { id: posting.id },
    data: { runningExerciseId: runningExercise.id },
  })
}

async function updateExistingStravaRun(
  tx: TransactionClient,
  params: {
    existing: Prisma.RunningExerciseGetPayload<{ include: { posting: true } }>
    activity: import('./strava').StravaActivity
    distance: number
    duration: number
    runDate: Date
    season: string
    visibility: Visibility
  },
) {
  const { existing, activity, distance, duration, runDate, season, visibility } = params
  const title = (activity.name ?? existing.posting?.text ?? 'Strava Lauf').trim()

  await tx.runningExercise.update({
    where: { id: existing.id },
    data: {
      distanceInMeters: distance,
      durationInSeconds: duration,
      source: ActivitySource.STRAVA,
    },
  })

  await tx.posting.update({
    where: { id: existing.postingId },
    data: {
      date: runDate,
      text: title,
      visibility,
      season,
    },
  })
}

async function markStatistics(
  tx: TransactionClient,
  userId: string,
  season: string,
  previous: RunSnapshot | null,
  next: RunSnapshot | null,
) {
  const runsDiff = (next ? 1 : 0) - (previous ? 1 : 0)
  const distanceDiff = (next?.distanceInMeters ?? 0) - (previous?.distanceInMeters ?? 0)
  const durationDiff = (next?.durationInSeconds ?? 0) - (previous?.durationInSeconds ?? 0)

  if (runsDiff === 0 && distanceDiff === 0 && durationDiff === 0) {
    return
  }

  const existing = await tx.runningStatistic.findUnique({ where: { userId } })

  if (!existing) {
    if (runsDiff <= 0 && distanceDiff <= 0 && durationDiff <= 0) {
      return
    }
    await tx.runningStatistic.create({
      data: {
        userId,
        numberOfRuns: Math.max(runsDiff, 0),
        distanceInMeters: Math.max(distanceDiff, 0),
        durationInSeconds: Math.max(durationDiff, 0),
        season,
      },
    })
    return
  }

  const updatedRuns = clampNonNegative(existing.numberOfRuns + runsDiff)
  const updatedDistance = clampNonNegative(existing.distanceInMeters + distanceDiff)
  const updatedDuration = clampNonNegative(existing.durationInSeconds + durationDiff)

  await tx.runningStatistic.update({
    where: { userId },
    data: {
      numberOfRuns: updatedRuns,
      distanceInMeters: updatedDistance,
      durationInSeconds: updatedDuration,
      season,
    },
  })
}

function clampNonNegative(value: number): number {
  return value < 0 ? 0 : value
}

function parseActivityDate(activity: import('./strava').StravaActivity): Date {
  const dateValue = activity.start_date_local || activity.start_date
  if (dateValue) {
    const parsed = new Date(dateValue)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }
  return new Date()
}

async function markEventProcessed(eventId: string) {
  await prisma.stravaWebhookEvent.update({
    where: { id: eventId },
    data: { processedAt: new Date() },
  })
}
