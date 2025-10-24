// server/api/team/requests/[id].approve.post.ts
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
    throw createError({ statusCode: 403, message: 'Nur Team-Admins dürfen Anfragen bestätigen.' })
  }

  const request = await prisma.groupJoinRequest.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          nameId: true,
          email: true,
          image: true,
          groupId: true,
        },
      },
    },
  })

  if (!request || request.groupId !== admin.groupId) {
    throw createError({ statusCode: 404, message: 'Anfrage nicht gefunden.' })
  }
  if (request.status !== 'PENDING') {
    throw createError({ statusCode: 400, message: 'Anfrage wurde bereits bearbeitet.' })
  }

  if (request.user.groupId && request.user.groupId !== admin.groupId) {
    throw createError({ statusCode: 400, message: 'Nutzer ist bereits in einem anderen Team.' })
  }

  const group = await prisma.group.findUnique({
    where: { id: admin.groupId },
    select: { maxMembers: true },
  })

  if (!group) {
    throw createError({ statusCode: 404, message: 'Team nicht gefunden.' })
  }

  const now = new Date()

  const result = await prisma.$transaction(async (tx) => {
    if (group.maxMembers != null) {
      const memberCount = await tx.user.count({ where: { groupId: admin.groupId } })
      if (memberCount >= group.maxMembers) {
        throw createError({ statusCode: 400, message: 'Dieses Team hat die maximale Größe erreicht.' })
      }
    }

    const updatedRequest = await tx.groupJoinRequest.update({
      where: { id: request.id },
      data: {
        status: 'APPROVED',
        decidedAt: now,
      },
    })

    const updatedUser = await tx.user.update({
      where: { id: request.user.id },
      data: {
        groupId: admin.groupId,
        groupRole: 'MEMBER',
      },
      select: {
        id: true,
        name: true,
        nameId: true,
        email: true,
        image: true,
        groupRole: true,
        createdAt: true,
      },
    })

    return { updatedRequest, updatedUser }
  })

  return {
    ok: true,
    request: {
      id: result.updatedRequest.id,
      status: 'approved',
      decidedAt: result.updatedRequest.decidedAt?.toISOString() ?? null,
    },
    member: {
      id: result.updatedUser.id,
      name: result.updatedUser.name,
      nameId: result.updatedUser.nameId,
      email: result.updatedUser.email,
      image: result.updatedUser.image,
      role: result.updatedUser.groupRole,
      roleLabel: result.updatedUser.groupRole === 'ADMIN' ? 'Admin' : 'Mitglied',
      joinedAt: now.toISOString(),
    },
  }
})
