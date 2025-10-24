// server/api/team/manage.get.ts
import { eventHandler, createError } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'

export default eventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const membership = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { groupId: true, groupRole: true },
  })

  if (!membership?.groupId) {
    throw createError({ statusCode: 404, message: 'Du bist in keinem Team.' })
  }
  if (membership.groupRole !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Nur Team-Admins haben Zugriff.' })
  }

  const group = await prisma.group.findUnique({
    where: { id: membership.groupId },
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
      users: {
        select: {
          id: true,
          name: true,
          nameId: true,
          email: true,
          image: true,
          groupRole: true,
          createdAt: true,
        },
        orderBy: [{ groupRole: 'desc' }, { createdAt: 'asc' }],
      },
      joinRequests: {
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              nameId: true,
              email: true,
              image: true,
            },
          },
        },
      },
      invites: {
        orderBy: { createdAt: 'desc' },
        include: {
          invitedBy: {
            select: { id: true, name: true, nameId: true, email: true },
          },
          acceptedBy: {
            select: { id: true, name: true, nameId: true, email: true },
          },
          targetUser: {
            select: { id: true, name: true, nameId: true, email: true },
          },
        },
      },
      _count: { select: { users: true } },
    },
  })

  if (!group) {
    throw createError({ statusCode: 404, message: 'Team nicht gefunden.' })
  }

  const now = Date.now()

  const members = group.users.map((user) => ({
    id: user.id,
    name: user.name,
    nameId: user.nameId,
    email: user.email,
    image: user.image,
    role: user.groupRole,
    roleLabel: user.groupRole === 'ADMIN' ? 'Admin' : 'Mitglied',
    joinedAt: user.createdAt?.toISOString() ?? null,
    isViewer: user.id === session.user.id,
  }))

  const joinRequests = group.joinRequests.map((request) => ({
    id: request.id,
    status: request.status === 'APPROVED'
      ? 'approved'
      : request.status === 'DECLINED'
        ? 'declined'
        : 'pending',
    message: request.message ?? '',
    createdAt: request.createdAt.toISOString(),
    decidedAt: request.decidedAt ? request.decidedAt.toISOString() : null,
    user: {
      id: request.user.id,
      name: request.user.name,
      nameId: request.user.nameId,
      email: request.user.email,
      image: request.user.image,
    },
  }))

  const invites = group.invites.map((invite) => {
    const expired = invite.expiresAt.getTime() < now
    const status = invite.acceptedAt
      ? 'accepted'
      : expired
        ? 'expired'
        : 'pending'

    return {
      id: invite.id,
      email: invite.email ?? '',
      note: invite.note ?? '',
      token: status === 'pending' ? invite.token : '',
      status,
      expiresAt: invite.expiresAt.toISOString(),
      acceptedAt: invite.acceptedAt ? invite.acceptedAt.toISOString() : null,
      invitedAt: invite.createdAt.toISOString(),
      invitedBy: invite.invitedBy ? {
        id: invite.invitedBy.id,
        name: invite.invitedBy.name,
        nameId: invite.invitedBy.nameId,
        email: invite.invitedBy.email,
      } : null,
      acceptedBy: invite.acceptedBy ? {
        id: invite.acceptedBy.id,
        name: invite.acceptedBy.name,
        nameId: invite.acceptedBy.nameId,
        email: invite.acceptedBy.email,
      } : null,
      targetUser: invite.targetUser ? {
        id: invite.targetUser.id,
        name: invite.targetUser.name,
        nameId: invite.targetUser.nameId,
        email: invite.targetUser.email,
      } : null,
    }
  })

  return {
    ok: true,
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
      members,
      memberCount: group._count.users,
      joinRequests,
      invites,
    },
  }
})
