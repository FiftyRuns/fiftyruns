import { createError, eventHandler } from 'h3'
import { markAllNotificationsRead } from '../../utils/notifications'
import { resolveSession } from '../../utils/session'
import { assertCsrf } from '../../utils/csrf'
import { prisma } from '../../utils/prisma'

export default eventHandler(async (event) => {
  assertCsrf(event)

  const session = await resolveSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  await markAllNotificationsRead(prisma, session.user.id)

  return { ok: true, unreadCount: 0 }
})
