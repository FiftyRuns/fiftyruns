// server/api/team/requests/[id].decline.post.ts
import { eventHandler, createError } from 'h3'
import { prisma } from '../../../utils/prisma'
import { resolveSession } from '../../../utils/session'
import { assertCsrf } from '../../../utils/csrf'

export default eventHandler(async (event) => {
  assertCsrf(event)

  const session = await resolveSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const id = event.context.params?.id as string | undefined
  if (!id) {
    throw createError({ statusCode: 400, message: 'Anfrage-ID fehlt.' })
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { groupId: true, groupRole: true },
  })

  if (!admin?.groupId) {
    throw createError({ statusCode: 400, message: 'Du bist in keinem Team.' })
  }
  if (admin.groupRole !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Nur Team-Admins dürfen Anfragen ablehnen.' })
  }

  const request = await prisma.groupJoinRequest.findUnique({
    where: { id },
    select: { id: true, groupId: true, status: true },
  })

  if (!request || request.groupId !== admin.groupId) {
    throw createError({ statusCode: 404, message: 'Anfrage nicht gefunden.' })
  }
  if (request.status !== 'PENDING') {
    throw createError({ statusCode: 400, message: 'Anfrage wurde bereits bearbeitet.' })
  }

  const updated = await prisma.groupJoinRequest.update({
    where: { id },
    data: {
      status: 'DECLINED',
      decidedAt: new Date(),
    },
  })

  return {
    ok: true,
    request: {
      id: updated.id,
      status: 'declined',
      decidedAt: updated.decidedAt?.toISOString() ?? null,
    },
  }
})
