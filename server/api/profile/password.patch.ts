import { createError, eventHandler, getCookie, getHeader, readBody } from 'h3'
import * as argon2 from 'argon2'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'

type UpdatePasswordBody = {
  currentPassword: string
  newPassword: string
}

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
  if (!session) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const body = await readBody<UpdatePasswordBody>(event)
  if (!body?.currentPassword || !body?.newPassword) {
    throw createError({ statusCode: 400, message: 'Passwörter fehlen.' })
  }

  if (body.newPassword.length < 8 || body.newPassword.length > 72) {
    throw createError({ statusCode: 400, message: 'Passwortlänge ungültig.' })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  })

  if (!user || !(await argon2.verify(user.password, body.currentPassword))) {
    throw createError({ statusCode: 403, message: 'Aktuelles Passwort ist falsch.' })
  }

  const newHash = await argon2.hash(body.newPassword, { type: argon2.argon2id })

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: newHash },
  })

  return { ok: true }
})
