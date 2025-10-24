// server/api/team/user-search.get.ts
import { eventHandler, createError, getQuery } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'

export default eventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { groupId: true, groupRole: true },
  })

  if (me?.groupId && me.groupRole !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Nur Team-Admins dürfen Mitglieder suchen.' })
  }

  const query = getQuery(event)
  const search = typeof query.q === 'string' ? query.q.trim() : ''
  const limit = Number.parseInt((query.limit as string) ?? '10', 10)
  const take = Number.isFinite(limit) && limit > 0 && limit <= 25 ? limit : 10

  if (search.length < 2) {
    return { users: [] }
  }

  const users = await prisma.user.findMany({
    where: {
      id: { not: session.user.id },
      groupId: null,
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { nameId: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      nameId: true,
      email: true,
      image: true,
    },
    orderBy: { name: 'asc' },
    take,
  })

  return {
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      nameId: user.nameId,
      email: user.email,
      image: user.image,
    })),
  }
})
