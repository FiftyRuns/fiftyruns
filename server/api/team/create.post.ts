// server/api/team/create.post.ts
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
  name: string
  nameId: string
  description?: string | null
  location?: string | null
}

export default eventHandler(async (event) => {
  assertCsrf(event)
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })

  const body = (await readBody<Body>(event)) || {}
  if (!body.name || !body.nameId) {
    throw createError({ statusCode: 400, message: 'Name und nameId sind erforderlich.' })
  }

  // ensure user not already in a team
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { groupId: true } })
  if (me?.groupId) throw createError({ statusCode: 400, message: 'Du bist bereits in einem Team.' })

  const created = await prisma.$transaction(async (tx) => {
    const group = await tx.group.create({
      data: {
        name: body.name,
        nameId: body.nameId,
        description: body.description ?? null,
        location: body.location ?? null,
      },
      select: { id: true, name: true, description: true, location: true, _count: { select: { users: true } } },
    })

    await tx.user.update({
      where: { id: session.user.id },
      data: { groupId: group.id, groupRole: 'ADMIN' },
    })

    // refresh count (now includes creator)
    const refreshed = await tx.group.findUnique({
      where: { id: group.id },
      select: { name: true, description: true, location: true, _count: { select: { users: true } } },
    })

    return refreshed!
  })

  return {
    ok: true,
    team: {
      name: created.name,
      description: created.description ?? '',
      location: created.location ?? '',
      members: created._count.users,
      roleLabel: 'Team Admin',
    },
  }
})
