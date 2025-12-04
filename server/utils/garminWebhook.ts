import { ActivitySource, Prisma, Visibility } from '@prisma/client'
import type { GarminWebhookEvent as PrismaGarminEvent } from '@prisma/client'
import { prisma } from './prisma'
import {
  GARMIN_RUNNING_ACTIVITY_TYPES,
  type GarminActivitySummary,
  type GarminWebhookPayload,
} from './garmin'
import { updateChallengesForRun, type RunSnapshot } from './challengeProgress'

type TransactionClient = Prisma.TransactionClient

const DEFAULT_VISIBILITY: Visibility = 'private'

export async function processGarminWebhookEvent(eventId: string) {
  const eventRecord = await prisma.garminWebhookEvent.findUnique({ where: { id: eventId } })
  if (!eventRecord || eventRecord.processedAt) return

  try {
    const payload = eventRecord.payload as GarminWebhookPayload

    // Alle Aktivitäten aus beiden Listen sammeln
    const allActivities: GarminActivitySummary[] = [
      ...(payload.activities ?? []),
      ...(payload.manuallyUpdatedActivities ?? []),
    ]

    // Jede Aktivität verarbeiten
    for (const activity of allActivities) {
      await processGarminActivity(activity)
    }

    await markEventProcessed(eventRecord.id)
  } catch (err) {
    if (process.dev) {
      console.error('[garmin-webhook] Verarbeitung fehlgeschlagen', err)
    }
  }
}

async function processGarminActivity(activity: GarminActivitySummary) {
  // Prüfen, ob es eine Lauf- oder Gehaktivität ist
  const activityType = String(activity.activityType || '').toUpperCase()
  if (!GARMIN_RUNNING_ACTIVITY_TYPES.has(activityType)) {
    return
  }

  // User über garminUserId finden
  const userId = String(activity.userId || '')
  if (!userId) {
    if (process.dev) {
      console.warn('[garmin-webhook] Aktivität ohne userId', activity)
    }
    return
  }

  const user = await prisma.user.findFirst({
    where: { garminUserId: userId },
    select: {
      id: true,
      name: true,
    },
  })

  if (!user) {
    if (process.dev) {
      console.warn('[garmin-webhook] Kein User gefunden für garminUserId', userId)
    }
    return
  }

  // Aktivitätsdaten extrahieren
  const startTimeInSeconds = Number(activity.startTimeInSeconds || 0)
  const startTimeOffsetInSeconds = Number(activity.startTimeOffsetInSeconds || 0)
  const startTime = new Date((startTimeInSeconds + startTimeOffsetInSeconds) * 1000)

  const distanceInMeters = Math.round(Number(activity.distanceInMeters || 0))
  const durationInSeconds = Math.round(Number(activity.durationInSeconds || 0))

  // Activity-ID für Dubletten-Prüfung
  const garminActivityId = activity.activityId || activity.summaryId || null
  if (!garminActivityId) {
    if (process.dev) {
      console.warn('[garmin-webhook] Aktivität ohne activityId/summaryId', activity)
    }
    return
  }

  // Text für Posting
  const activityName = activity.activityName?.trim() || ''
  const deviceName = activity.deviceName?.trim() || ''
  let text = activityName
  if (deviceName) {
    text = text ? `${text} (${deviceName})` : deviceName
  }
  if (!text) {
    text = 'Garmin Lauf'
  }

  const season = `${startTime.getFullYear()}`

  await prisma.$transaction(async (tx) => {
    // Prüfen, ob bereits ein Eintrag mit dieser Garmin-Activity-ID existiert
    const existing = await tx.runningExercise.findUnique({
      where: { garminActivityId },
      include: { posting: true },
    })

    const nextSnapshot: RunSnapshot = {
      distanceInMeters,
      durationInSeconds,
    }

    if (!existing) {
      // Neue Aktivität erstellen
      await createNewGarminRun(tx, {
        userId: user.id,
        garminActivityId,
        distance: distanceInMeters,
        duration: durationInSeconds,
        startTime,
        season,
        visibility: DEFAULT_VISIBILITY,
        text,
      })
      await markStatistics(tx, user.id, season, null, nextSnapshot)
      await updateChallengesForRun(tx, {
        userId: user.id,
        runDate: startTime,
        previous: null,
        next: nextSnapshot,
      })
      return
    }

    // Bestehende Aktivität aktualisieren
    const previousSnapshot: RunSnapshot = {
      distanceInMeters: existing.distanceInMeters,
      durationInSeconds: existing.durationInSeconds,
    }

    await updateExistingGarminRun(tx, {
      existing,
      distance: distanceInMeters,
      duration: durationInSeconds,
      startTime,
      season,
      visibility: DEFAULT_VISIBILITY,
      text,
    })

    await markStatistics(tx, user.id, season, previousSnapshot, nextSnapshot)
    await updateChallengesForRun(tx, {
      userId: user.id,
      runDate: startTime,
      previous: previousSnapshot,
      next: nextSnapshot,
    })
  })
}

async function createNewGarminRun(
  tx: TransactionClient,
  params: {
    userId: string
    garminActivityId: string
    distance: number
    duration: number
    startTime: Date
    season: string
    visibility: Visibility
    text: string
  },
) {
  const { userId, garminActivityId, distance, duration, startTime, season, visibility, text } =
    params

  const posting = await tx.posting.create({
    data: {
      userId,
      date: startTime,
      text: text.trim() || 'Garmin Lauf',
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
      garminActivityId,
      source: ActivitySource.GARMIN,
    },
  })

  await tx.posting.update({
    where: { id: posting.id },
    data: { runningExerciseId: runningExercise.id },
  })
}

async function updateExistingGarminRun(
  tx: TransactionClient,
  params: {
    existing: Prisma.RunningExerciseGetPayload<{ include: { posting: true } }>
    distance: number
    duration: number
    startTime: Date
    season: string
    visibility: Visibility
    text: string
  },
) {
  const { existing, distance, duration, startTime, season, visibility, text } = params

  await tx.runningExercise.update({
    where: { id: existing.id },
    data: {
      distanceInMeters: distance,
      durationInSeconds: duration,
      source: ActivitySource.GARMIN,
    },
  })

  await tx.posting.update({
    where: { id: existing.postingId },
    data: {
      date: startTime,
      text: text.trim() || existing.posting?.text || 'Garmin Lauf',
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

async function markEventProcessed(eventId: string) {
  await prisma.garminWebhookEvent.update({
    where: { id: eventId },
    data: { processedAt: new Date() },
  })
}





