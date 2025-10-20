// server/api/post.create.post.ts
import { createError, eventHandler, getCookie, getHeader, readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'

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

  const body = (await readBody<CreatePostBody>(event)) || {}

  const content = (body.content || '').trim()
  if (!content) {
    throw createError({ statusCode: 400, message: 'Beitragsinhalt darf nicht leer sein.' })
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
      if (!u.protocol.startsWith('http')) {
        throw new Error('Ungültige URL')
      }
      imageUrl = u.toString()
    } catch {
      throw createError({ statusCode: 400, message: 'Bild-URL ist ungültig.' })
    }
  }

  const now = new Date()
  const season = `${now.getFullYear()}`
  const garminActivityId = body.garminActivityId ?? null

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
