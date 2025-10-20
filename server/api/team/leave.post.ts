// server/api/team/leave.post.ts
import { eventHandler, createError, getCookie, getHeader } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'

function assertCsrf(event: Parameters<typeof getHeader>[0]) {
  const header = getHeader(event, 'x-csrf-token') || ''
  const cookie = getCookie(event, 'csrf_token') || ''
  if (!header || !cookie || header !== cookie) {
    throw createError({ statusCode: 403, message: 'CSRF-Prüfung fehlgeschlagen.' })
  }
}

export default eventHandler(async (event) => {
  assertCsrf(event)
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, groupId: true, groupRole: true, createdAt: true },
  })
  if (!me?.groupId) return { ok: true, team: null } // nothing to do

  await prisma.$transaction(async (tx) => {
    const others = await tx.user.findMany({
      where: { groupId: me.groupId, id: { not: me.id } },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    if (me.groupRole === 'ADMIN') {
      if (others.length === 0) {
        // last member & admin -> delete group
        await tx.user.update({
          where: { id: me.id },
          data: { groupId: null, groupRole: null },
        })
        await tx.group.delete({ where: { id: me.groupId } })
        return
      } else {
        // promote oldest other member
        const promoteId = others[0].id
        await tx.user.update({
          where: { id: promoteId },
          data: { groupRole: 'ADMIN' },
        })
      }
    }

    // leave team
    await tx.user.update({
      where: { id: me.id },
      data: { groupId: null, groupRole: null },
    })
  })

  return { ok: true, team: null }
})
