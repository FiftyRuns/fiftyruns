// server/api/team/join.post.ts
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

type Body = { nameId: string }

export default eventHandler(async (event) => {
  assertCsrf(event)
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })

  const body = (await readBody<Body>(event)) || {}
  if (!body.nameId) throw createError({ statusCode: 400, message: 'nameId fehlt.' })

  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { groupId: true } })
  if (me?.groupId) throw createError({ statusCode: 400, message: 'Du bist bereits in einem Team.' })

  const group = await prisma.group.findUnique({
    where: { nameId: body.nameId },
    select: {
      id: true,
      name: true,
      nameId: true,
      description: true,
      location: true,
      visibility: true,
      requireApproval: true,
      maxMembers: true,
      _count: { select: { users: true } },
    },
  })
  if (!group) throw createError({ statusCode: 404, message: 'Team nicht gefunden.' })

  if (group.visibility !== 'public' || group.requireApproval !== false) {
    throw createError({
      statusCode: 403,
      message: 'Dieses Team erlaubt keinen direkten Beitritt. Bitte sende eine Anfrage.',
    })
  }

  if (group.maxMembers != null && group._count.users >= group.maxMembers) {
    throw createError({ statusCode: 400, message: 'Dieses Team hat die maximale Größe erreicht.' })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { groupId: group.id, groupRole: 'MEMBER' },
  })

  const members = group._count.users + 1

  return {
    ok: true,
    team: {
      name: group.name,
      description: group.description ?? '',
      location: group.location ?? '',
      members,
      roleLabel: 'Mitglied',
    },
  }
})
