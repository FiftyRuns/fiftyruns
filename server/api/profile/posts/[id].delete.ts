// server/api/profile/posts/[id].delete.ts
import { createError, eventHandler } from 'h3'
import { prisma } from '../../../utils/prisma'
import { resolveSession } from '../../../utils/session'
import { assertCsrf } from '../../../utils/csrf'
import { updateChallengesForRun } from '../../../utils/challengeProgress'

export default eventHandler(async (event) => {
  assertCsrf(event)

  const session = await resolveSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const id = event.context.params?.id as string | undefined
  if (!id) {
    throw createError({ statusCode: 400, message: 'Post-ID fehlt.' })
  }

  // Post inkl. Laufdaten laden & Ownership prüfen
  const post = await prisma.posting.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      userId: true,
      date: true,
      runningExercise: {
        select: { distanceInMeters: true, durationInSeconds: true },
      },
    },
  })

  if (!post) {
    throw createError({ statusCode: 404, message: 'Beitrag nicht gefunden.' })
  }

  const hadRun = !!post.runningExercise
  const dist = post.runningExercise?.distanceInMeters ?? 0
  const dur  = post.runningExercise?.durationInSeconds ?? 0
  const previousSnapshot = hadRun
    ? {
        distanceInMeters: post.runningExercise!.distanceInMeters,
        durationInSeconds: post.runningExercise!.durationInSeconds,
      }
    : null
  const runDate = post.date

  await prisma.$transaction(async (tx) => {
    // 1) Beitrag löschen (durch onDelete: Cascade werden RunningExercise, Comments, Reactions mitentfernt)
    await tx.posting.delete({ where: { id: post.id } })

    // 2) Statistik zurückrechnen, falls Laufdaten existierten
    if (hadRun) {
      const stat = await tx.runningStatistic.findUnique({ where: { userId: post.userId } })
      if (stat) {
        await tx.runningStatistic.update({
          where: { userId: post.userId },
          data: {
            numberOfRuns: Math.max(0, stat.numberOfRuns - 1),
            distanceInMeters: Math.max(0, stat.distanceInMeters - dist),
            durationInSeconds: Math.max(0, stat.durationInSeconds - dur),
          },
        })
      }
      // Falls keine Statistik existiert, nichts zu tun (kein negatives Upsert).
      await updateChallengesForRun(tx, {
        userId: post.userId,
        runDate,
        previous: previousSnapshot,
        next: null,
      })
    }
  })

  return { ok: true }
})
