import { createError, eventHandler, readBody } from 'h3'
import { markNotificationsRead } from '../../utils/notifications'
import { resolveSession } from '../../utils/session'
import { assertCsrf } from '../../utils/csrf'
import { prisma } from '../../utils/prisma'

type Body = {
  ids?: string[]
}

export default eventHandler(async (event) => {
  assertCsrf(event)

  const session = await resolveSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const body = (await readBody<Body>(event)) || {}
  const ids = Array.isArray(body.ids) ? body.ids.filter((value): value is string => typeof value === 'string' && value) : []

  if (!ids.length) {
    throw createError({ statusCode: 400, message: 'Keine Benachrichtigungen angegeben.' })
  }

  await markNotificationsRead(prisma, session.user.id, ids)

  const unreadCount = await prisma.notification.count({
    where: {
      userId: session.user.id,
      readBy: { none: { userId: session.user.id } },
    },
  })

  return { ok: true, unreadCount }
})
