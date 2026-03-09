import { ActivitySource } from '@@/prisma/generated/client'
import { createError, eventHandler, readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { resolveSession } from '../../../utils/session'
import { assertCsrf } from '../../../utils/csrf'
import { updateChallengesForRun } from '../../../utils/challengeProgress'

const DONATION_MULTIPLIER_TO_CENTS: Record<'x1' | 'x2' | 'x5' | 'x10', number> = {
  x1: 100,
  x2: 200,
  x5: 500,
  x10: 1000,
}

type UpdatePostBody = {
  content?: string
  visibility?: 'public' | 'protected' | 'private'
  image?: string | null
  distanceInMeters?: number | null
  durationInSeconds?: number | null
}

export default eventHandler(async (event) => {
  assertCsrf(event)

  const session = await resolveSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const id = event.context.params?.id
  if (!id || typeof id !== 'string') {
    throw createError({ statusCode: 400, message: 'Post-ID fehlt.' })
  }

  const body = (await readBody<UpdatePostBody>(event)) || {}

  const post = await prisma.posting.findUnique({
    where: { id },
    select: {
      userId: true,
      season: true,
      runningExercise: {
        select: {
          distanceInMeters: true,
          durationInSeconds: true,
        },
      },
      donation: {
        select: {
          amountInCent: true,
        },
      },
      date: true,
    },
  })

  if (!post || post.userId !== session.user.id) {
    throw createError({ statusCode: 404, message: 'Beitrag nicht gefunden.' })
  }

  const updateData: { text?: string; visibility?: 'public' | 'protected' | 'private'; image?: string | null } = {}

  if (typeof body.content === 'string') {
    const trimmed = body.content.trim()
    if (!trimmed) {
      throw createError({ statusCode: 400, message: 'Beitragsinhalt darf nicht leer sein.' })
    }
    updateData.text = trimmed
  }

  if (body.visibility !== undefined) {
    if (!['public', 'protected', 'private'].includes(body.visibility ?? '')) {
      throw createError({ statusCode: 400, message: 'Ungültige Sichtbarkeit.' })
    }
    updateData.visibility = body.visibility ?? 'protected'
  }

  if ('image' in body) {
    if (typeof body.image === 'string') {
      const trimmed = body.image.trim()
      if (trimmed.length === 0) {
        updateData.image = null
      } else {
        try {
          const parsed = new URL(trimmed)
          if (!parsed.protocol.startsWith('http')) {
            throw new Error('Ungültiges Protokoll')
          }
          updateData.image = parsed.toString()
        } catch {
          throw createError({ statusCode: 400, message: 'Bild-URL ist ungültig.' })
        }
      }
    } else {
      updateData.image = null
    }
  }

  const runUpdateRequested =
    body.distanceInMeters !== undefined || body.durationInSeconds !== undefined

  if (runUpdateRequested) {
    if (body.distanceInMeters === undefined || body.durationInSeconds === undefined) {
      throw createError({
        statusCode: 400,
        message: 'Distanz und Dauer müssen gemeinsam übermittelt werden.',
      })
    }
  }

  let runAction: 'none' | 'create' | 'update' | 'delete' = 'none'
  let nextDistance: number | null = post.runningExercise?.distanceInMeters ?? null
  let nextDuration: number | null = post.runningExercise?.durationInSeconds ?? null
  let deltaRuns = 0
  let deltaDistance = 0
  let deltaDuration = 0

  if (runUpdateRequested) {
    const distance = body.distanceInMeters
    const duration = body.durationInSeconds
    const hadRun = Boolean(post.runningExercise)
    const previousDistance = post.runningExercise?.distanceInMeters ?? 0
    const previousDuration = post.runningExercise?.durationInSeconds ?? 0

    // Handle null/undefined checks more explicitly
    if ((distance === null || distance === undefined) && (duration === null || duration === undefined)) {
      if (hadRun) {
        runAction = 'delete'
        nextDistance = null
        nextDuration = null
        deltaRuns = -1
        deltaDistance = -previousDistance
        deltaDuration = -previousDuration
      }
    } else {
      // Check if either value is null or undefined (but not both)
      if ((distance === null || distance === undefined) !== (duration === null || duration === undefined)) {
        throw createError({
          statusCode: 400,
          message: 'Distanz und Dauer dürfen nicht einzeln gesetzt werden.',
        })
      }

      // Ensure both values are defined and valid numbers
      if (distance === undefined || distance === null || !Number.isInteger(distance) || distance < 0) {
        throw createError({ statusCode: 400, message: 'Distanz muss eine ganze Zahl ≥ 0 sein.' })
      }
      if (duration === undefined || duration === null || !Number.isInteger(duration) || duration < 0) {
        throw createError({ statusCode: 400, message: 'Dauer muss eine ganze Zahl ≥ 0 sein.' })
      }

      // Now TypeScript knows distance and duration are numbers
      nextDistance = distance
      nextDuration = duration

      if (hadRun) {
        runAction = 'update'
        deltaDistance = distance - previousDistance
        deltaDuration = duration - previousDuration
      } else {
        runAction = 'create'
        deltaRuns = 1
        deltaDistance = distance
        deltaDuration = duration
      }
    }
  }

  if (!Object.keys(updateData).length && runAction === 'none') {
    throw createError({ statusCode: 400, message: 'Keine Änderungen übermittelt.' })
  }

  const donorPreferences = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { autoDonate: true, runDonationMultiplier: true },
  })

  const donationAmountInCent =
    donorPreferences?.autoDonate && donorPreferences.runDonationMultiplier
      ? DONATION_MULTIPLIER_TO_CENTS[donorPreferences.runDonationMultiplier] ?? 0
      : 0

  const previousSnapshot = post.runningExercise
    ? {
        distanceInMeters: post.runningExercise.distanceInMeters,
        durationInSeconds: post.runningExercise.durationInSeconds,
      }
    : null

  const runDate = post.date

  await prisma.$transaction(async (tx) => {
    if (Object.keys(updateData).length) {
      await tx.posting.update({ where: { id }, data: updateData })
    }

    if (runAction !== 'none') {
      if (runAction === 'delete') {
        await tx.runningExercise.delete({ where: { postingId: id } })
      } else if (runAction === 'update') {
        await tx.runningExercise.update({
          where: { postingId: id },
          data: {
            distanceInMeters: nextDistance!,
            durationInSeconds: nextDuration!,
            source: ActivitySource.MANUAL,
          },
        })
      } else if (runAction === 'create') {
        await tx.runningExercise.create({
          data: {
            postingId: id,
            distanceInMeters: nextDistance!,
            durationInSeconds: nextDuration!,
            source: ActivitySource.MANUAL,
          },
        })
      }

      const stat = await tx.runningStatistic.findUnique({
        where: { userId: session.user.id },
      })

      const nextRuns = Math.max(0, (stat?.numberOfRuns ?? 0) + deltaRuns)
      const nextDistanceTotal = Math.max(0, (stat?.distanceInMeters ?? 0) + deltaDistance)
      const nextDurationTotal = Math.max(0, (stat?.durationInSeconds ?? 0) + deltaDuration)

      if (!stat) {
        if (nextRuns > 0 || nextDistanceTotal > 0 || nextDurationTotal > 0) {
          await tx.runningStatistic.create({
            data: {
              userId: session.user.id,
              numberOfRuns: nextRuns,
              distanceInMeters: nextDistanceTotal,
              durationInSeconds: nextDurationTotal,
              season: post.season,
            },
          })
        }
      } else {
        await tx.runningStatistic.update({
          where: { userId: session.user.id },
          data: {
            numberOfRuns: nextRuns,
            distanceInMeters: nextDistanceTotal,
            durationInSeconds: nextDurationTotal,
          },
        })
      }
    }

    if (runAction === 'delete') {
      if (post.donation) {
        await tx.donation.delete({ where: { postingId: id } })
      }
    } else if (runAction === 'create' || runAction === 'update') {
      if (donationAmountInCent > 0) {
        await tx.donation.upsert({
          where: { postingId: id },
          create: {
            postingId: id,
            amountInCent: donationAmountInCent,
          },
          update: {
            amountInCent: donationAmountInCent,
          },
        })
      } else if (post.donation) {
        await tx.donation.delete({ where: { postingId: id } })
      }
    }

    if (runAction !== 'none') {
      const nextSnapshot =
        runAction === 'delete'
          ? null
          : {
              distanceInMeters: nextDistance,
              durationInSeconds: nextDuration,
            }

      await updateChallengesForRun(tx, {
        userId: session.user.id,
        runDate,
        previous: previousSnapshot,
        next: nextSnapshot,
      })
    }
  })

  return { ok: true }
})
