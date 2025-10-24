// server/api/team/me.get.ts
import { eventHandler, createError } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'

export default eventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      groupId: true,
      groupRole: true,
    },
  })

  if (!me?.groupId) {
    return { team: null }
  }

  const group = await prisma.group.findUnique({
    where: { id: me.groupId },
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
      _count: { select: { users: true } },
    },
  })

  if (!group) {
    return { team: null }
  }

  const members = group.users.map((member) => ({
    id: member.id,
    name: member.name,
    nameId: member.nameId,
    email: member.email,
    image: member.image,
    role: member.groupRole,
    roleLabel: member.groupRole === 'ADMIN' ? 'Admin' : 'Mitglied',
    joinedAt: member.createdAt?.toISOString() ?? null,
    isViewer: member.id === session.user.id,
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
      memberCount: group._count.users,
      myRole: me.groupRole,
      members,
    },
  }
})
