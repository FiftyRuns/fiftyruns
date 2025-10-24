// server/api/team/requests.post.ts
import { eventHandler, createError, readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'
import { assertCsrf } from '../../utils/csrf'

type Body = {
  nameId: string
  message?: string | null
}

export default eventHandler(async (event) => {
  assertCsrf(event)

  const session = await resolveSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const body = (await readBody<Body>(event)) || {}
  const nameId = body.nameId?.trim()
  if (!nameId) {
    throw createError({ statusCode: 400, message: 'Team-Kennung fehlt.' })
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { groupId: true },
  })

  if (me?.groupId) {
    throw createError({ statusCode: 400, message: 'Du bist bereits in einem Team.' })
  }

  const group = await prisma.group.findUnique({
    where: { nameId },
    select: {
      id: true,
      name: true,
      visibility: true,
      requireApproval: true,
      maxMembers: true,
      _count: { select: { users: true } },
    },
  })

  if (!group) {
    throw createError({ statusCode: 404, message: 'Team nicht gefunden.' })
  }

  if (group.visibility !== 'public') {
    throw createError({ statusCode: 403, message: 'Dieses Team akzeptiert Beitritte nur über Einladungen.' })
  }

  if (group.maxMembers != null && group._count.users >= group.maxMembers) {
    throw createError({ statusCode: 400, message: 'Dieses Team hat die maximale Größe erreicht.' })
  }

  const existing = await prisma.groupJoinRequest.findUnique({
    where: {
      groupId_userId: { groupId: group.id, userId: session.user.id },
    },
  })

  const now = new Date()
  let request

  if (group.requireApproval === false) {
    const result = await prisma.$transaction(async (tx) => {
      const memberCount = await tx.user.count({ where: { groupId: group.id } })
      if (group.maxMembers != null && memberCount >= group.maxMembers) {
        throw createError({ statusCode: 400, message: 'Dieses Team hat die maximale Größe erreicht.' })
      }

      const joined = await tx.user.update({
        where: { id: session.user.id },
        data: { groupId: group.id, groupRole: 'MEMBER' },
        select: {
          id: true,
          name: true,
          nameId: true,
          email: true,
          image: true,
        },
      })

      const record = existing
        ? await tx.groupJoinRequest.update({
            where: { id: existing.id },
            data: {
              status: 'APPROVED',
              decidedAt: now,
              message: body.message ?? existing.message ?? null,
            },
          })
        : await tx.groupJoinRequest.create({
            data: {
              groupId: group.id,
              userId: session.user.id,
              status: 'APPROVED',
              message: body.message ?? null,
              decidedAt: now,
            },
          })

      return { joined, record }
    })

    return {
      ok: true,
      joined: true,
      request: {
        id: result.record.id,
        status: 'approved' as const,
        decidedAt: result.record.decidedAt?.toISOString() ?? now.toISOString(),
      },
    }
  }

  if (existing) {
    if (existing.status === 'PENDING') {
      throw createError({ statusCode: 400, message: 'Es gibt bereits eine offene Anfrage.' })
    }
    request = await prisma.groupJoinRequest.update({
      where: { id: existing.id },
      data: {
        status: 'PENDING',
        message: body.message ?? null,
        createdAt: now,
        decidedAt: null,
      },
    })
  } else {
    request = await prisma.groupJoinRequest.create({
      data: {
        groupId: group.id,
        userId: session.user.id,
        status: 'PENDING',
        message: body.message ?? null,
      },
    })
  }

  // TODO: Notification / Email dispatch to team admin (not yet implemented)

  return {
    ok: true,
    request: {
      id: request.id,
      status: 'pending',
      createdAt: request.createdAt.toISOString(),
    },
  }
})
