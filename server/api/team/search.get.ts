// server/api/team/search.get.ts
import { eventHandler, getQuery } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'

export default eventHandler(async (event) => {
  const query = getQuery(event)
  const searchRaw = typeof query.q === 'string' ? query.q.trim() : ''
  const limit = Number.parseInt((query.limit as string) ?? '20', 10)
  const take = Number.isFinite(limit) && limit > 0 && limit <= 50 ? limit : 20

  const session = await resolveSession(event)

  const baseWhere = {
    visibility: { not: 'private' as const },
  }

  const where =
    searchRaw.length >= 2
      ? {
          ...baseWhere,
          OR: [
            { name: { contains: searchRaw, mode: 'insensitive' } },
            { description: { contains: searchRaw, mode: 'insensitive' } },
            { location: { contains: searchRaw, mode: 'insensitive' } },
          ],
        }
      : baseWhere

  const groups = await prisma.group.findMany({
    where,
    select: {
      id: true,
      name: true,
      nameId: true,
      description: true,
      location: true,
      createdAt: true,
      coverImage: true,
      visibility: true,
      requireApproval: true,
      maxMembers: true,
      users: {
        select: {
          id: true,
          name: true,
          nameId: true,
          image: true,
          groupRole: true,
        },
        orderBy: [{ groupRole: 'desc' }, { createdAt: 'asc' }],
        take: 6,
      },
      _count: { select: { users: true } },
    },
    orderBy: searchRaw ? { name: 'asc' } : { createdAt: 'desc' },
    take,
  })

  const viewerGroupId =
    session &&
    (await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { groupId: true },
    }))?.groupId

  const viewerRequests = session
    ? await prisma.groupJoinRequest.findMany({
        where: {
          userId: session.user.id,
          groupId: { in: groups.map((g) => g.id) },
        },
        select: { groupId: true, status: true, id: true },
      })
    : []

  const requestByGroup = new Map<string, { status: string; id: string }>()
  for (const entry of viewerRequests) {
    requestByGroup.set(entry.groupId, { status: entry.status, id: entry.id })
  }

  const teams = groups.map((group) => {
    const request = requestByGroup.get(group.id)
    const admin = group.users.find((user) => user.groupRole === 'ADMIN') || null
    return {
      id: group.id,
      name: group.name,
      nameId: group.nameId,
      description: group.description ?? '',
      location: group.location ?? '',
      createdAt: group.createdAt?.toISOString() ?? null,
      coverImage: group.coverImage ?? '',
      visibility: group.visibility,
      requireApproval: group.requireApproval,
      maxMembers: group.maxMembers,
      memberCount: group._count.users,
      admin: admin
        ? {
            id: admin.id,
            name: admin.name,
            nameId: admin.nameId,
            image: admin.image,
          }
        : null,
      previewMembers: group.users.map((user) => ({
        id: user.id,
        name: user.name,
        nameId: user.nameId,
        image: user.image,
        role: user.groupRole,
      })),
      viewer: session
        ? {
            isMember: viewerGroupId === group.id,
            hasTeam: Boolean(viewerGroupId && viewerGroupId !== group.id),
            requestStatus: request
              ? request.status === 'APPROVED'
                ? 'approved'
                : request.status === 'DECLINED'
                  ? 'declined'
                  : 'pending'
              : null,
            requestId: request?.id ?? null,
            belongsToOtherTeam: Boolean(viewerGroupId && viewerGroupId !== group.id),
          }
        : {
            isMember: false,
            hasTeam: false,
            requestStatus: null,
            requestId: null,
            belongsToOtherTeam: false,
          },
    }
  })

  return { teams }
})
