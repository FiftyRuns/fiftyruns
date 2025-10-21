// api/auth/register.ts
import { eventHandler, getMethod, getHeader, createError, readBody, getCookie, H3Event } from 'h3'
import { randomBytes } from 'node:crypto'
import * as argon2 from 'argon2'
import { prisma } from '../../utils/prisma'
import { sendVerificationEmail } from '../../utils/sendVerificationEmail'

const rateLimitMap = new Map<string, { count: number; expires: number }>()

function sanitizeBasic(input: string) {
  return input.replace(/<[^>]*>/g, '').replace(/[\u0000-\u001F\u007F]/g, '').trim()
}
function slugify(v: string) {
  return sanitizeBasic(v)
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9\-\s_]/g, '').replace(/[\s_]+/g, '-').replace(/\-+/g, '-')
    .replace(/^-|-$/g, '')
}
async function checkRateLimit(_event: H3Event, key: string, limit = 8, windowSec = 60) {
  const now = Date.now(), k = `register:${key}`
  const e = rateLimitMap.get(k)
  if (e && e.expires > now) { if (e.count >= limit) return false; e.count++ } 
  else { rateLimitMap.set(k, { count: 1, expires: now + windowSec * 1000 }) }
  return true
}
function assertCsrf(event: H3Event) {
  const header = getHeader(event, 'x-csrf-token') || ''
  const cookie = getCookie(event, 'csrf_token') || ''
  if (!header || !cookie || header !== cookie)
    throw createError({ statusCode: 403, message: 'CSRF-Prüfung fehlgeschlagen.' })
}

function validateInput(input: any) {
  const errors: Record<string, string> = {}
  const name = sanitizeBasic(String(input?.name || ''))
  const nameId = slugify(String(input?.nameId || ''))
  const email = sanitizeBasic(String(input?.email || '')).toLowerCase()
  const password = String(input?.password || '')
  const avatarUrlRaw = String(input?.avatarUrl || '').trim()

  // Basisprüfungen
  if (!name || name.length < 2 || name.length > 48) errors.name = 'Ungültiger Anzeigename.'
  if (!nameId || !/^[a-z0-9](?:[a-z0-9-]{1,30})[a-z0-9]$/.test(nameId)) errors.nameId = 'Ungültiger Benutzername.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 100) errors.email = 'Ungültige E-Mail.'

  const strong = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password)
  if (!strong || password.length > 72) errors.password = 'Passwortanforderungen nicht erfüllt.'

  // Avatar-URL optional validieren (http/https; max. Länge)
  let avatarUrl: string | null = null
  if (avatarUrlRaw) {
    try {
      const u = new URL(avatarUrlRaw)
      if (!/^https?:$/.test(u.protocol)) throw new Error('protocol')
      if (avatarUrlRaw.length > 2048) throw new Error('len')
      avatarUrl = u.toString()
      // optional strenger: nur Vercel Blob erlauben
      // if (!u.hostname.endsWith('blob.vercel-storage.com')) throw new Error('host')
    } catch {
      errors.avatarUrl = 'Avatar-URL ungültig.'
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors, name, nameId, email, password, avatarUrl
  }
}

export default eventHandler(async (event) => {
  if (getMethod(event) !== 'POST') throw createError({ statusCode: 405, message: 'Method Not Allowed' })

  const origin = getHeader(event, 'origin') || ''
  const allowed = (process.env.PUBLIC_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean)
  if (allowed.length && origin && !allowed.includes(origin))
    throw createError({ statusCode: 403, message: 'Ungültige Herkunft.' })

  assertCsrf(event)

  const ip = getHeader(event, 'x-forwarded-for')?.split(',')[0] || getHeader(event, 'x-real-ip') || 'local'
  if (!(await checkRateLimit(event, ip, 8, 60)))
    throw createError({ statusCode: 429, message: 'Zu viele Versuche. Bitte später erneut.' })

  const body = await readBody(event)
  const { valid, errors, name, nameId, email, password, avatarUrl } = validateInput(body)
  if (!valid) throw createError({ statusCode: 400, message: Object.values(errors)[0] })

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id })
  const emailVerificationToken = randomBytes(32).toString('hex')

  try {
    await prisma.user.create({
      data: {
        name,
        nameId,
        email,
        password: passwordHash,
        emailVerified: false,
        emailVerificationToken,
        image: avatarUrl || null, 
      },
    })

    if (process.env.RESEND_API_KEY) {
      try {
        await sendVerificationEmail({ to: email, token: emailVerificationToken })
      } catch (emailErr) {
        console.error('Verification email failed', emailErr)
      }
    } else {
      console.warn('RESEND_API_KEY not set – skipping verification email.')
    }

    return { ok: true }
  } catch (err: any) {
    if (err?.code === 'P2002') {
      throw createError({ statusCode: 409, message: 'E-Mail oder Benutzername bereits vergeben.' })
    }
    console.error('register error', err)
    throw createError({ statusCode: 500, message: 'Interner Fehler.' })
  }
})
