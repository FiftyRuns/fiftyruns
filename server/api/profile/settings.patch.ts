import { createError, eventHandler, getCookie, getHeader, readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'

type UpdateSettingsBody = {
  name?: string
  email?: string
  bio?: string | null
  visibility?: 'public' | 'protected' | 'private'
  notifications?: boolean
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

  const body = (await readBody<UpdateSettingsBody>(event)) || {}

  const data: Record<string, unknown> = {}

  if (typeof body.name === 'string' && body.name.trim().length >= 2) {
    data.name = body.name.trim()
  }

  if (typeof body.email === 'string' && body.email.includes('@')) {
    data.email = body.email.trim().toLowerCase()
  }

  if (body.bio !== undefined) {
    data.bio = body.bio ? body.bio.trim() : null
  }

  if (body.visibility) {
    if (!['public', 'protected', 'private'].includes(body.visibility)) {
      throw createError({ statusCode: 400, message: 'Ungültige Sichtbarkeit.' })
    }
    data.profileVisibility = body.visibility
  }

  if (typeof body.notifications === 'boolean') {
    data.notificationsEnabled = body.notifications
  }

  if (Object.keys(data).length === 0) {
    throw createError({ statusCode: 400, message: 'Keine Änderungen übermittelt.' })
  }

  data.profileSettingsUpdatedAt = new Date()

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data,
    })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      throw createError({ statusCode: 409, message: 'Name oder E-Mail bereits vergeben.' })
    }
    throw createError({ statusCode: 500, message: 'Profil konnte nicht aktualisiert werden.' })
  }

  return { ok: true }
})
