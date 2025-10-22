import { createError, eventHandler, readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'
import { assertCsrf } from '../../utils/csrf'

type Visibility = 'public' | 'protected' | 'private'
type GoalType = 'DISTANCE' | 'TIME' | 'RUNS'

interface CreateChallengeBody {
  name?: string
  description?: string
  prize?: string
  image?: string | null
  startAt?: string
  endAt?: string
  goal?: {
    type?: GoalType
    distanceMeters?: number
    durationSeconds?: number
    runs?: number
  }
  visibility?: Visibility
  sponsorLogos?: string[]
  minDistanceMeters?: number | null
  minDurationSeconds?: number | null
  teamId?: string | null
}

const ALLOWED_VISIBILITY: Visibility[] = ['public', 'protected', 'private']

export default eventHandler(async (event) => {
  assertCsrf(event)

  const session = await resolveSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const body = (await readBody<CreateChallengeBody>(event)) ?? {}
  const name = (body.name ?? '').trim()
  if (!name || name.length < 4) {
    throw createError({ statusCode: 400, message: 'Name der Challenge ist zu kurz.' })
  }

  const startAt = body.startAt ? new Date(body.startAt) : null
  const endAt = body.endAt ? new Date(body.endAt) : null

  if (!startAt || !endAt || Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    throw createError({ statusCode: 400, message: 'Start- und Enddatum sind erforderlich.' })
  }

  if (endAt <= startAt) {
    throw createError({ statusCode: 400, message: 'Enddatum muss nach dem Startdatum liegen.' })
  }

  const goalType = body.goal?.type ?? 'RUNS'
  if (!['DISTANCE', 'TIME', 'RUNS'].includes(goalType)) {
    throw createError({ statusCode: 400, message: 'Ungültiges Ziel.' })
  }

  const goalDistanceMeters = goalType === 'DISTANCE' ? asPositiveInt(body.goal?.distanceMeters) : null
  const goalDurationSeconds = goalType === 'TIME' ? asPositiveInt(body.goal?.durationSeconds) : null
  const goalRuns = goalType === 'RUNS' ? asPositiveInt(body.goal?.runs) : null

  if (goalType === 'DISTANCE' && !goalDistanceMeters) {
    throw createError({ statusCode: 400, message: 'Bitte gib ein Distanz-Ziel an.' })
  }
  if (goalType === 'TIME' && !goalDurationSeconds) {
    throw createError({ statusCode: 400, message: 'Bitte gib ein Zeit-Ziel an.' })
  }
  if (goalType === 'RUNS' && !goalRuns) {
    throw createError({ statusCode: 400, message: 'Bitte gib ein Lauf-Ziel an.' })
  }

  const minDistanceMeters = body.minDistanceMeters != null ? asPositiveInt(body.minDistanceMeters) : null
  const minDurationSeconds = body.minDurationSeconds != null ? asPositiveInt(body.minDurationSeconds) : null

  const visibility: Visibility = ALLOWED_VISIBILITY.includes(body.visibility ?? 'public')
    ? (body.visibility as Visibility)
    : 'public'

  const sponsorLogos = Array.isArray(body.sponsorLogos)
    ? body.sponsorLogos.filter((entry) => typeof entry === 'string' && entry.trim().length > 0).slice(0, 5)
    : []

  let groupId: string | null = null
  if (body.teamId) {
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
    groupId = group.id
  }

  const nameId = await generateUniqueSlug(name)

  const challenge = await prisma.challenge.create({
    data: {
      name,
      nameId,
      description: body.description?.trim() ?? null,
      prize: body.prize?.trim() ?? null,
      image: sanitizeUrl(body.image),
      startAt,
      endAt,
      goalType,
      goalDistanceMeters,
      goalDurationSeconds,
      goalRuns,
      minDistanceMeters,
      minDurationSeconds,
      visibility,
      sponsorLogos,
      adminUserId: session.user.id,
      groupId,
      members: {
        create: { userId: session.user.id },
      },
      highscores: {
        create: { userId: session.user.id },
      },
    },
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
      visibility: true,
      sponsorLogos: true,
      groupId: true,
    },
  })

  return challenge
})

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name)
  let slug = base
  let counter = 1
  while (true) {
    const exists = await prisma.challenge.findUnique({ where: { nameId: slug }, select: { id: true } })
    if (!exists) return slug
    counter += 1
    slug = `${base}-${counter}`
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'challenge'
}

function asPositiveInt(input: unknown): number | null {
  const value = Number(input)
  if (!Number.isFinite(value) || value <= 0) return null
  return Math.round(value)
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
