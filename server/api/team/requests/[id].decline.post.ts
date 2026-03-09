// server/api/team/requests/[id].decline.post.ts
import { NotificationActionType, NotificationCategory } from '@@/prisma/generated/client'
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
    throw createError({ statusCode: 403, message: 'Nur Team-Admins dürfen Anfragen ablehnen.' })
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
          image: true,
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

  const now = new Date()

  const updated = await prisma.groupJoinRequest.update({
    where: { id },
    data: {
      status: 'DECLINED',
      decidedAt: now,
    },
  })

  const groupInfo = request.group ?? {
    id: admin.groupId,
    name: 'Dein Team',
    nameId: 'team',
  }

  const actionPayload = {
    requestId: request.id,
    status: 'DECLINED' as const,
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
      title: 'Team-Anfrage abgelehnt',
      message: `Die Anfrage von ${request.user.name} wurde abgelehnt.`,
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
      type: 'team.join_request.declined',
      title: 'Deine Team-Anfrage wurde abgelehnt',
      message: `Leider hat ${groupInfo.name} deine Anfrage abgelehnt.`,
      link: '/team/discover',
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
      id: updated.id,
      status: 'declined',
      decidedAt: updated.decidedAt?.toISOString() ?? null,
    },
  }
})
