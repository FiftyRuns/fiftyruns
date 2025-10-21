import type { H3Event } from 'h3'
import { createError, getCookie, getHeader } from 'h3'

export function assertCsrf(event: H3Event) {
  const header = getHeader(event, 'x-csrf-token') || ''
  const cookie = getCookie(event, 'csrf_token') || ''

  if (!header || !cookie || header !== cookie) {
    throw createError({ statusCode: 403, message: 'CSRF-Prüfung fehlgeschlagen.' })
  }
}
