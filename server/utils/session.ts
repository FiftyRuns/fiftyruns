import { randomBytes } from 'node:crypto'
import { H3Event, getCookie, deleteCookie, setCookie } from 'h3'
import { prisma } from './prisma'
import type { AuthUser } from '@/types/auth'

export const SESSION_COOKIE = 'session_token'
export const SESSION_MAX_AGE: number = 60 * 60 * 24 * 7 // 7 days

export interface CreatedSession {
  token: string
  expiresAt: Date
}

export interface ResolvedSession extends CreatedSession {
  user: AuthUser
}

function setSessionCookie(event: H3Event, token: string, maxAge: number) {
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  })
}

export async function createSession(
  event: H3Event,
  userId: string,
  maxAge: number = SESSION_MAX_AGE,
): Promise<CreatedSession> {
  const token = randomBytes(48).toString('hex')
  const expiresAt = new Date(Date.now() + maxAge * 1000)

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  })

  setSessionCookie(event, token, maxAge)

  return { token, expiresAt }
}

export async function destroySession(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return

  await prisma.session.deleteMany({ where: { token } })
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

export async function resolveSession(event: H3Event): Promise<ResolvedSession | null> {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session) {
    deleteCookie(event, SESSION_COOKIE, { path: '/' })
    return null
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { token } })
    deleteCookie(event, SESSION_COOKIE, { path: '/' })
    return null
  }

  const user: AuthUser = {
    id: session.user.id,
    name: session.user.name,
    nameId: session.user.nameId,
    email: session.user.email,
    bio: session.user.bio || '',
  }

  return { token, user, expiresAt: session.expiresAt }
}
