// server/api/team/requests/[id].approve.post.ts
import { NotificationActionType, NotificationCategory } from '@prisma/client'
import { eventHandler, createError } from 'h3'
import { prisma } from '../../../utils/prisma'
import { resolveSession } from '../../../utils/session'
import { assertCsrf } from '../../../utils/csrf'
import { createNotification, markNotificationsRead } from '../../../utils/notifications'

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
    select: {
      id: true,
      groupId: true,
      status: true,
      message: true,
      user: {
        select: {
          id: true,
          name: true,
          nameId: true,
          email: true,
          image: true,
          groupId: true,
          notificationsEnabled: true,
        },
      },
      group: {
        select: {
          id: true,
          name: true,
          nameId: true,
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

  const groupInfo = request.group ?? {
    id: admin.groupId,
    name: 'Dein Team',
    nameId: 'team',
  }

  const actionPayload = {
    requestId: request.id,
    status: 'APPROVED' as const,
    decidedAt: now.toISOString(),
    decidedBy: {
      id: session.user.id,
      name: session.user.name,
    },
    group: groupInfo,
    requester: {
      id: request.user.id,
      name: request.user.name,
      nameId: request.user.nameId,
      image: request.user.image ?? null,
    },
    message: request.message ?? null,
  }

  await prisma.notification.updateMany({
    where: { joinRequestId: request.id },
    data: {
      title: 'Team-Anfrage erledigt',
      message: `${request.user.name} wurde in das Team aufgenommen.`,
      actionType: NotificationActionType.TEAM_JOIN_REQUEST,
      actionPayload,
    },
  })

  const adminNotifications = await prisma.notification.findMany({
    where: { joinRequestId: request.id, userId: session.user.id },
    select: { id: true },
  })

  if (adminNotifications.length > 0) {
    await markNotificationsRead(
      prisma,
      session.user.id,
      adminNotifications.map((entry) => entry.id),
    )
  }

  if (request.user.notificationsEnabled) {
    await createNotification(prisma, {
      userId: request.user.id,
      category: NotificationCategory.TEAM,
      type: 'team.join_request.approved',
      title: 'Deine Team-Anfrage wurde angenommen',
      message: `Du bist jetzt Mitglied im Team ${groupInfo.name}.`,
      link: `/team/${groupInfo.nameId}`,
      data: {
        groupId: groupInfo.id,
        groupName: groupInfo.name,
        groupNameId: groupInfo.nameId,
        decidedBy: {
          id: session.user.id,
          name: session.user.name,
        },
      },
    })
  }

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
