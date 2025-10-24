// server/api/team/invite/[id].delete.ts
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
    throw createError({ statusCode: 400, message: 'Einladungs-ID fehlt.' })
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { groupId: true, groupRole: true },
  })

  if (!admin?.groupId) {
    throw createError({ statusCode: 400, message: 'Du bist in keinem Team.' })
  }
  if (admin.groupRole !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Nur Team-Admins dürfen Einladungen verwalten.' })
  }

  const invite = await prisma.groupInvite.findUnique({
    where: { id },
    select: { id: true, groupId: true, acceptedAt: true },
  })

  if (!invite || invite.groupId !== admin.groupId) {
    throw createError({ statusCode: 404, message: 'Einladung nicht gefunden.' })
  }
  if (invite.acceptedAt) {
    throw createError({ statusCode: 400, message: 'Diese Einladung wurde bereits angenommen.' })
  }

  await prisma.groupInvite.delete({ where: { id: invite.id } })

  return { ok: true }
})
