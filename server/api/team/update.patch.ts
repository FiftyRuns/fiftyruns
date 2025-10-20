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
}

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

  const updated = await prisma.group.update({
    where: { id: me.groupId },
    data: {
      description: body.description ?? undefined,
      location: body.location ?? undefined,
    },
    select: { name: true, description: true, location: true, _count: { select: { users: true } } },
  })

  return {
    ok: true,
    team: {
      name: updated.name,
      description: updated.description ?? '',
      location: updated.location ?? '',
      members: updated._count.users,
      roleLabel: 'Team Admin',
    },
  }
})
