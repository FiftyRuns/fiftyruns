import { NotificationCategory, NotificationActionType } from '@@/prisma/generated/client'
import { createError, eventHandler, getQuery } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'

type CategoryKey = keyof typeof NotificationCategory

function parseCategoryParam(value: unknown): NotificationCategory | null {
  if (typeof value !== 'string' || !value) return null
  if (value.toUpperCase() === 'ALL') return null
  const normalized = value.toUpperCase() as CategoryKey
  if ((NotificationCategory as Record<string, string>)[normalized]) {
    return NotificationCategory[normalized as keyof typeof NotificationCategory]
  }
  return null
}

function mapCategoryCounts<T extends string>(
  categories: readonly NotificationCategory[],
  counts: Record<string, number>,
  resolver: (category: NotificationCategory) => T,
) {
  return categories.reduce<Record<T, number>>((acc, category) => {
    const key = resolver(category)
    acc[key] = counts[category] ?? 0
    return acc
  }, {} as Record<T, number>)
}

export default eventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const query = getQuery(event)
  const categoryFilter = parseCategoryParam(query.category)

  const baseWhere = {
    userId: session.user.id,
    ...(categoryFilter ? { category: categoryFilter } : {}),
  }

  const categories = Object.values(NotificationCategory)

  const [items, unreadCount, totals, unreadTotals] = await Promise.all([
    prisma.notification.findMany({
      where: baseWhere,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        readBy: {
          where: { userId: session.user.id },
          select: { id: true },
        },
      },
    }),
    prisma.notification.count({
      where: {
        userId: session.user.id,
        readBy: { none: { userId: session.user.id } },
      },
    }),
    prisma.notification.groupBy({
      by: ['category'],
      where: { userId: session.user.id },
      _count: { _all: true },
    }),
    prisma.notification.groupBy({
      by: ['category'],
      where: {
        userId: session.user.id,
        readBy: { none: { userId: session.user.id } },
      },
      _count: { _all: true },
    }),
  ])

  const totalCounts: Record<string, number> = {}
  for (const entry of totals) {
    totalCounts[entry.category] = entry._count._all
  }
  const unreadCounts: Record<string, number> = {}
  for (const entry of unreadTotals) {
    unreadCounts[entry.category] = entry._count._all
  }

  const itemsDto = items.map((item) => {
    const isRead = item.readBy.length > 0
    const action =
      item.actionType != null
        ? {
            type: item.actionType as NotificationActionType,
            payload: (item.actionPayload as Record<string, unknown> | null) ?? null,
          }
        : null

    return {
      id: item.id,
      category: item.category as NotificationCategory,
      type: item.type,
      title: item.title,
      message: item.message,
      link: item.link,
      data: (item.data as Record<string, unknown> | null) ?? null,
      action,
      joinRequestId: item.joinRequestId ?? null,
      createdAt: item.createdAt.toISOString(),
      isRead,
    }
  })

  return {
    items: itemsDto,
    unreadCount,
    totals: mapCategoryCounts(categories, totalCounts, (category) => category),
    unreadTotals: mapCategoryCounts(categories, unreadCounts, (category) => category),
  }
})
