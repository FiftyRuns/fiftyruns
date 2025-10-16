import { eventHandler, getMethod, getHeader, createError, readBody, getCookie } from 'h3'
import * as argon2 from 'argon2'
import { prisma } from '../../utils/prisma'
import { createSession, SESSION_MAX_AGE, destroySession } from '../../utils/session'

const rateLimitMap = new Map<string, { count: number; expires: number }>()

function sanitizeBasic(input: string) {
  return input.replace(/<[^>]*>/g, '').replace(/[\u0000-\u001f\u007f]/g, '').trim()
}

function assertCsrf(event: Parameters<typeof getHeader>[0]) {
  const header = getHeader(event, 'x-csrf-token') || ''
  const cookie = getCookie(event, 'csrf_token') || ''
  if (!header || !cookie || header !== cookie)
    throw createError({ statusCode: 403, message: 'CSRF-Prüfung fehlgeschlagen.' })
}

async function checkRateLimit(key: string, limit = 10, windowSec = 60) {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (entry && entry.expires > now) {
    if (entry.count >= limit) return false
    entry.count++
  } else {
    rateLimitMap.set(key, { count: 1, expires: now + windowSec * 1000 })
  }

  return true
}

export default eventHandler(async (event) => {
  if (getMethod(event) !== 'POST') {
    throw createError({ statusCode: 405, message: 'Method Not Allowed' })
  }

  const origin = getHeader(event, 'origin') || ''
  const allowed = (process.env.PUBLIC_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (allowed.length && origin && !allowed.includes(origin)) {
    throw createError({ statusCode: 403, message: 'Ungültige Herkunft.' })
  }

  assertCsrf(event)

  const ip =
    getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ||
    getHeader(event, 'x-real-ip') ||
    'local'

  if (!(await checkRateLimit(`login:${ip}`, 12, 60))) {
    throw createError({ statusCode: 429, message: 'Zu viele Versuche. Bitte später erneut.' })
  }

  const body = await readBody<{
    email?: string
    password?: string
    rememberMe?: boolean
  }>(event)

  const email = sanitizeBasic(String(body?.email || '')).toLowerCase()
  const password = String(body?.password || '')
  const remember = Boolean(body?.rememberMe)

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 100) {
    throw createError({ statusCode: 400, message: 'Ungültige Zugangsdaten.' })
  }

  if (!password) {
    throw createError({ statusCode: 400, message: 'Passwort erforderlich.' })
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    throw createError({ statusCode: 401, message: 'Benutzer oder Passwort falsch.' })
  }

  const validPassword = await argon2.verify(user.password, password)
  if (!validPassword) {
    throw createError({ statusCode: 401, message: 'Benutzer oder Passwort falsch.' })
  }

  if (!user.emailVerified) {
    throw createError({
      statusCode: 403,
      message: 'Bitte bestätige zuerst deine E-Mail-Adresse.',
    })
  }

  await destroySession(event)

  const maxAge = remember ? SESSION_MAX_AGE * 2 : SESSION_MAX_AGE
  const session = await createSession(event, user.id, maxAge)

  return {
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      nameId: user.nameId,
      email: user.email,
    },
    expiresAt: session.expiresAt,
  }
})
