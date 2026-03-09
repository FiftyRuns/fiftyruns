import { NotificationActionType, NotificationCategory, PrismaClient } from '@@/prisma/generated/client'
import type { Prisma as PrismaNamespace } from '@@/prisma/generated/client'
import { prisma } from './prisma'

type PrismaClientOrTransaction = PrismaClient | PrismaNamespace.TransactionClient

export type CreateNotificationInput = {
  userId: string
  category: NotificationCategory
  type: string
  title: string
  message: string
  link?: string | null
  data?: PrismaNamespace.JsonValue
  actionType?: NotificationActionType | null
  actionPayload?: PrismaNamespace.JsonValue
  joinRequestId?: string | null
}

function resolveClient(client?: PrismaClientOrTransaction) {
  return client ?? prisma
}

export async function createNotification(
  client: PrismaClientOrTransaction | undefined,
  input: CreateNotificationInput,
) {
  const db = resolveClient(client)
  return db.notification.create({
    data: {
      userId: input.userId,
      category: input.category,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
      data: input.data ?? null,
      actionType: input.actionType ?? null,
      actionPayload: input.actionPayload ?? null,
      joinRequestId: input.joinRequestId ?? null,
    },
  })
}

export async function markNotificationsRead(
  client: PrismaClientOrTransaction | undefined,
  userId: string,
  notificationIds: string[],
) {
  if (!notificationIds.length) return 0
  const db = resolveClient(client)

  const rows = notificationIds.map((notificationId) => ({
    notificationId,
    userId,
  }))

  const result = await db.readNotification.createMany({
    data: rows,
    skipDuplicates: true,
  })

  return result.count
}

export async function markAllNotificationsRead(
  client: PrismaClientOrTransaction | undefined,
  userId: string,
) {
  const db = resolveClient(client)
  const unread = await db.notification.findMany({
    where: {
      userId,
      readBy: { none: { userId } },
    },
    select: { id: true },
  })

  if (!unread.length) return 0

  return markNotificationsRead(db, userId, unread.map((entry) => entry.id))
}
