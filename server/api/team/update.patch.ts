// server/api/team/update.patch.ts
import { eventHandler, readBody, createError, getCookie, getHeader } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'

function assertCsrf(event: Parameters<typeof getHeader>[0]) {
  const header = getHeader(event, 'x-csrf-token') || ''
  const cookie = getCookie(event, 'csrf_token') || ''
  if (!header || !cookie || header !== cookie) {
    throw createError({ statusCode: 403, message: 'CSRF-Prüfung fehlgeschlagen.' })
  }
}

type Body = {
  description?: string | null
  location?: string | null
  coverImage?: string | null
  visibility?: 'public' | 'protected' | 'private'
  requireApproval?: boolean
  maxMembers?: number | null
}

const VISIBILITY_OPTIONS = new Set(['public', 'protected', 'private'])

export default eventHandler(async (event) => {
  assertCsrf(event)
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { groupId: true, groupRole: true },
  })
  if (!me?.groupId) throw createError({ statusCode: 400, message: 'Du bist in keinem Team.' })
  if (me.groupRole !== 'ADMIN') throw createError({ statusCode: 403, message: 'Nur Admins dürfen Teamdaten ändern.' })

  const body = (await readBody<Body>(event)) || {}

  const visibility = body.visibility
  if (visibility && !VISIBILITY_OPTIONS.has(visibility)) {
    throw createError({ statusCode: 400, message: 'Ungültige Sichtbarkeit.' })
  }

  let maxMembers: number | null | undefined = undefined
  if (body.maxMembers !== undefined) {
    if (body.maxMembers === null) {
      maxMembers = null
    } else {
      const parsed = Number.parseInt(String(body.maxMembers), 10)
      if (!Number.isFinite(parsed) || parsed < 2 || parsed > 500) {
        throw createError({ statusCode: 400, message: 'Maximale Teamgröße muss zwischen 2 und 500 liegen.' })
      }
      maxMembers = parsed
    }
  }

  const requireApproval = body.requireApproval

  const current = await prisma.group.findUnique({
    where: { id: me.groupId },
    select: { _count: { select: { users: true } } },
  })
  if (!current) {
    throw createError({ statusCode: 404, message: 'Team nicht gefunden.' })
  }

  if (maxMembers != null && current._count.users > maxMembers) {
    throw createError({
      statusCode: 400,
      message: `Das Team hat bereits ${current._count.users} Mitglieder und kann nicht kleiner skaliert werden.`,
    })
  }

  const updated = await prisma.group.update({
    where: { id: me.groupId },
    data: {
      description: body.description ?? undefined,
      location: body.location ?? undefined,
      coverImage: body.coverImage !== undefined ? body.coverImage : undefined,
      visibility: visibility ?? undefined,
      requireApproval: requireApproval ?? undefined,
      maxMembers: maxMembers ?? undefined,
    },
    select: {
      name: true,
      nameId: true,
      description: true,
      location: true,
      coverImage: true,
      visibility: true,
      requireApproval: true,
      maxMembers: true,
      _count: { select: { users: true } },
    },
  })

  return {
    ok: true,
    team: {
      name: updated.name,
      nameId: updated.nameId,
      description: updated.description ?? '',
      location: updated.location ?? '',
      coverImage: updated.coverImage ?? '',
      visibility: updated.visibility,
      requireApproval: updated.requireApproval,
      maxMembers: updated.maxMembers,
      members: updated._count.users,
      roleLabel: 'Admin',
    },
  }
})
