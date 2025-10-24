// server/api/team/members/[id].delete.ts
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
    throw createError({ statusCode: 400, message: 'Mitglieds-ID fehlt.' })
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { groupId: true, groupRole: true },
  })

  if (!admin?.groupId) {
    throw createError({ statusCode: 400, message: 'Du bist in keinem Team.' })
  }
  if (admin.groupRole !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Nur Team-Admins dürfen Mitglieder verwalten.' })
  }

  if (id === session.user.id) {
    throw createError({ statusCode: 400, message: 'Nutze die Funktion „Team verlassen“, um dich selbst zu entfernen.' })
  }

  const member = await prisma.user.findUnique({
    where: { id },
    select: { id: true, groupId: true, groupRole: true },
  })

  if (!member || member.groupId !== admin.groupId) {
    throw createError({ statusCode: 404, message: 'Mitglied nicht gefunden.' })
  }

  if (member.groupRole === 'ADMIN') {
    const otherAdmins = await prisma.user.count({
      where: {
        groupId: admin.groupId,
        groupRole: 'ADMIN',
        id: { not: member.id },
      },
    })
    if (otherAdmins === 0) {
      throw createError({ statusCode: 400, message: 'Es muss mindestens ein Admin verbleiben.' })
    }
  }

  await prisma.user.update({
    where: { id: member.id },
    data: { groupId: null, groupRole: null },
  })

  return { ok: true }
})
