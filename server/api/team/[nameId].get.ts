// server/api/team/[nameId].get.ts
import { eventHandler, createError } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'

export default eventHandler(async (event) => {
  const nameId = event.context.params?.nameId as string | undefined
  if (!nameId) {
    throw createError({ statusCode: 400, message: 'Team-Kennung fehlt.' })
  }

  const session = await resolveSession(event)

  const group = await prisma.group.findUnique({
    where: { nameId },
    select: {
      id: true,
      name: true,
      nameId: true,
      description: true,
      location: true,
      coverImage: true,
      visibility: true,
      requireApproval: true,
      maxMembers: true,
      createdAt: true,
      users: {
        select: {
          id: true,
          name: true,
          nameId: true,
          image: true,
          groupRole: true,
          createdAt: true,
        },
        orderBy: [{ groupRole: 'desc' }, { createdAt: 'asc' }],
      },
      _count: { select: { users: true } },
    },
  })

  if (!group) {
    throw createError({ statusCode: 404, message: 'Team nicht gefunden.' })
  }

  let viewerState: {
    isAuthenticated: boolean
    isMember: boolean
    role: 'ADMIN' | 'MEMBER' | null
    hasPendingRequest: boolean
    requestStatus: 'pending' | 'approved' | 'declined' | null
    canRequestToJoin: boolean
    requestId: string | null
    belongsToOtherTeam: boolean
  } = {
    isAuthenticated: Boolean(session),
    isMember: false,
    role: null,
    hasPendingRequest: false,
    requestStatus: null,
    canRequestToJoin: false,
    requestId: null,
    belongsToOtherTeam: false,
  }

  if (session) {
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { groupId: true, groupRole: true },
    })

    const membership = group.users.find((u) => u.id === session.user.id) || null

    if (membership) {
      viewerState = {
        isAuthenticated: true,
        isMember: true,
        role: membership.groupRole ?? null,
        hasPendingRequest: false,
        requestStatus: null,
        canRequestToJoin: false,
        requestId: null,
        belongsToOtherTeam: false,
      }
    } else {
      const request = await prisma.groupJoinRequest.findUnique({
        where: {
          groupId_userId: {
            groupId: group.id,
            userId: session.user.id,
          },
        },
      })

      const belongsElsewhere = Boolean(me?.groupId && me.groupId !== group.id)

      const requestStatus = request
        ? request.status === 'APPROVED'
          ? 'approved'
          : request.status === 'DECLINED'
            ? 'declined'
            : 'pending'
        : null

      const canRequest =
        !me?.groupId &&
        group.visibility === 'public' &&
        (!request || request.status !== 'PENDING')

      viewerState = {
        isAuthenticated: true,
        isMember: false,
        role: me?.groupId === group.id ? (me.groupRole ?? null) : null,
        hasPendingRequest: request?.status === 'PENDING',
        requestStatus,
        canRequestToJoin: canRequest,
        requestId: request?.id ?? null,
        belongsToOtherTeam: belongsElsewhere,
      }
    }
  } else {
    viewerState.canRequestToJoin = false
    viewerState.belongsToOtherTeam = false
  }

  const admins = group.users.filter((user) => user.groupRole === 'ADMIN')
  const admin = admins[0] ?? null

  const members = group.users.map((user) => ({
    id: user.id,
    name: user.name,
    nameId: user.nameId,
    image: user.image,
    role: user.groupRole,
    roleLabel: user.groupRole === 'ADMIN' ? 'Admin' : 'Mitglied',
  }))

  return {
    team: {
      id: group.id,
      name: group.name,
      nameId: group.nameId,
      description: group.description ?? '',
      location: group.location ?? '',
      coverImage: group.coverImage ?? '',
      visibility: group.visibility,
      requireApproval: group.requireApproval,
      maxMembers: group.maxMembers,
      createdAt: group.createdAt?.toISOString() ?? null,
      memberCount: group._count.users,
      admin: admin
        ? {
            id: admin.id,
            name: admin.name,
            nameId: admin.nameId,
            image: admin.image,
          }
        : null,
      members,
      viewer: viewerState,
    },
  }
})
