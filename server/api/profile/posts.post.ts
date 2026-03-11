// server/api/post.create.post.ts
import { ActivitySource, NotificationCategory } from '@@/prisma/generated/client'
import { createError, eventHandler, getCookie, getHeader, readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'
import { updateChallengesForRun } from '../../utils/challengeProgress'
import { createNotification } from '../../utils/notifications'

const DONATION_MULTIPLIER_TO_CENTS: Record<'x1' | 'x2' | 'x5' | 'x10', number> = {
  x1: 100,
  x2: 200,
  x5: 500,
  x10: 1000,
}

type CreatePostBody = {
  content: string
  visibility?: 'public' | 'protected' | 'private'
  image?: string | null
  distanceInMeters: number
  durationInSeconds: number
  garminActivityId?: string | null
}

function assertCsrf(event: Parameters<typeof getHeader>[0]) {
  const header = getHeader(event, 'x-csrf-token') || ''
  const cookie = getCookie(event, 'csrf_token') || ''
  if (!header || !cookie || header !== cookie) {
    throw createError({ statusCode: 403, message: 'CSRF-Prüfung fehlgeschlagen.' })
  }
}

export default eventHandler(async (event) => {
  assertCsrf(event)

  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })

  const donorPreferences = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { autoDonate: true, runDonationMultiplier: true, notificationsEnabled: true },
  })

  const body = (await readBody<CreatePostBody>(event)) || {}

  const content = (body.content || '').trim()
  if (!content) {
    throw createError({ statusCode: 400, message: 'Beitragsinhalt darf nicht leer sein.' })
  }
  if (content.length > 2000) {
    throw createError({ statusCode: 400, message: 'Beitragsinhalt darf maximal 2000 Zeichen lang sein.' })
  }

  const visibility = body.visibility ?? 'protected'
  if (!['public', 'protected', 'private'].includes(visibility)) {
    throw createError({ statusCode: 400, message: 'Ungültige Sichtbarkeit.' })
  }

  const distanceInMeters = Number(body.distanceInMeters)
  const durationInSeconds = Number(body.durationInSeconds)
  if (!Number.isInteger(distanceInMeters) || distanceInMeters < 0 ||
      !Number.isInteger(durationInSeconds) || durationInSeconds < 0) {
    throw createError({
      statusCode: 400,
      message: 'Distanz/Zeit ungültig (ganze Zahlen ≥ 0 erwartet).',
    })
  }

  // Bild-URL validieren (optional)
  let imageUrl: string | null = null
  if (body.image) {
    try {
      const u = new URL(body.image)
      if (u.protocol !== 'https:') {
        throw new Error('Ungültige URL')
      }
      imageUrl = u.toString()
    } catch {
      throw createError({ statusCode: 400, message: 'Bild-URL ist ungültig.' })
    }
  }

  const now = body.createdAt ? new Date(body.createdAt) : new Date()
  if (isNaN(now.getTime())) throw createError({ statusCode: 400, message: 'Ungültiges Datum.' })
  // Season immer serverseitig bestimmen – verhindert Season-Manipulation durch den Client
  const season = String(new Date().getFullYear())

  let garminActivityId: string | null = null
  if (body.garminActivityId) {
    const raw = String(body.garminActivityId)
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(raw)) {
      throw createError({ statusCode: 400, message: 'Ungültige Garmin-Aktivitäts-ID.' })
    }
    garminActivityId = raw
  }
  const donationAmountInCent =
    donorPreferences?.autoDonate && donorPreferences.runDonationMultiplier
      ? DONATION_MULTIPLIER_TO_CENTS[donorPreferences.runDonationMultiplier] ?? 0
      : 0

  const result = await prisma.$transaction(async (tx) => {
    // 1) Posting mit Bild speichern
    const post = await tx.posting.create({
      data: {
        userId: session.user.id,
        date: now,
        text: content,
        image: imageUrl, // hier wird die URL gespeichert
        visibility,
        season,
      },
      select: {
        id: true,
        date: true,
        text: true,
        visibility: true,
        image: true,
        _count: { select: { reactions: true, comments: true } },
      },
    })

    // 2) RunningExercise anlegen
    await tx.runningExercise.create({
      data: {
        postingId: post.id,
        distanceInMeters,
        durationInSeconds,
        garminActivityId,
        source: garminActivityId ? ActivitySource.GARMIN : ActivitySource.MANUAL,
      },
    })

    // 3) Statistik aktualisieren
    await tx.runningStatistic.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        numberOfRuns: 1,
        distanceInMeters,
        durationInSeconds,
        season,
      },
      update: {
        numberOfRuns: { increment: 1 },
        distanceInMeters: { increment: distanceInMeters },
        durationInSeconds: { increment: durationInSeconds },
      },
    })

    await updateChallengesForRun(tx, {
      userId: session.user.id,
      runDate: now,
      previous: null,
      next: {
        distanceInMeters,
        durationInSeconds,
      },
    })

    if (donationAmountInCent > 0) {
      await tx.donation.create({
        data: {
          postingId: post.id,
          amountInCent: donationAmountInCent,
        },
      })
    }

    const distanceLabel = formatDistanceLabel(distanceInMeters)
    const durationLabel = formatDurationLabel(durationInSeconds)

    if (donorPreferences?.notificationsEnabled !== false) {
      await createNotification(tx, {
        userId: session.user.id,
        category: NotificationCategory.RUN,
        type: 'run.recorded',
        title: 'Neuer Lauf gespeichert',
        message: `Du hast einen Lauf über ${distanceLabel} km in ${durationLabel} erfasst.`,
        link: `/postings/${post.id}`,
        data: {
          postingId: post.id,
          distanceInMeters,
          durationInSeconds,
          distanceLabel,
          durationLabel,
          season,
        },
      })
    }

    return post
  })

  return {
    id: result.id,
    createdAt: result.date.toISOString(),
    text: result.text,
    visibility: result.visibility,
    image: result.image,
    reactions: result._count.reactions,
    comments: result._count.comments,
  }
})

function formatDistanceLabel(distanceInMeters: number) {
  const kilometers = distanceInMeters / 1000
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(kilometers)
}

function formatDurationLabel(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const pad = (value: number) => value.toString().padStart(2, '0')
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  }
  return `${pad(minutes)}:${pad(seconds)}`
}
