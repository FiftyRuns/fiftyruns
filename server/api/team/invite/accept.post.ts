// server/api/team/invite/accept.post.ts
import { eventHandler, createError, readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { resolveSession } from '../../../utils/session'
import { assertCsrf } from '../../../utils/csrf'

type Body = {
  token: string
}

export default eventHandler(async (event) => {
  assertCsrf(event)

  const session = await resolveSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const body = (await readBody<Body>(event)) || {}
  const token = body.token?.trim()
  if (!token) {
    throw createError({ statusCode: 400, message: 'Einladungstoken fehlt.' })
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { groupId: true },
  })
  if (me?.groupId) {
    throw createError({ statusCode: 400, message: 'Du bist bereits in einem Team.' })
  }

  const invite = await prisma.groupInvite.findUnique({
    where: { token },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          nameId: true,
          description: true,
          location: true,
          coverImage: true,
          maxMembers: true,
          _count: { select: { users: true } },
        },
      },
    },
  })

  if (!invite) {
    throw createError({ statusCode: 404, message: 'Einladung nicht gefunden.' })
  }
  if (invite.acceptedAt) {
    throw createError({ statusCode: 400, message: 'Diese Einladung wurde bereits verwendet.' })
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    throw createError({ statusCode: 400, message: 'Diese Einladung ist abgelaufen.' })
  }
  if (invite.targetUserId && invite.targetUserId !== session.user.id) {
    throw createError({ statusCode: 403, message: 'Diese Einladung ist für ein anderes Mitglied vorgesehen.' })
  }

  if (invite.group.maxMembers != null && invite.group._count.users >= invite.group.maxMembers) {
    throw createError({ statusCode: 400, message: 'Dieses Team hat die maximale Größe erreicht.' })
  }

  const now = new Date()

  await prisma.$transaction(async (tx) => {
    if (invite.group.maxMembers != null) {
      const current = await tx.user.count({ where: { groupId: invite.groupId } })
      if (current >= invite.group.maxMembers) {
        throw createError({ statusCode: 400, message: 'Dieses Team hat die maximale Größe erreicht.' })
      }
    }

    await tx.user.update({
      where: { id: session.user.id },
      data: { groupId: invite.groupId, groupRole: 'MEMBER' },
    })

    await tx.groupJoinRequest.updateMany({
      where: {
        groupId: invite.groupId,
        userId: session.user.id,
        status: 'PENDING',
      },
      data: { status: 'APPROVED', decidedAt: now },
    })

    await tx.groupInvite.update({
      where: { id: invite.id },
      data: {
        acceptedAt: now,
        acceptedById: session.user.id,
      },
    })
  })

  return {
    ok: true,
    team: {
      id: invite.group.id,
      name: invite.group.name,
      nameId: invite.group.nameId,
      description: invite.group.description ?? '',
      location: invite.group.location ?? '',
      members: invite.group._count.users + 1,
      coverImage: invite.group.coverImage ?? '',
      roleLabel: 'Mitglied',
    },
  }
})
