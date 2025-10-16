import { eventHandler, getMethod, createError, getHeader, getCookie } from 'h3'
import { destroySession } from '../../utils/session'

function assertCsrf(event: Parameters<typeof getHeader>[0]) {
  const header = getHeader(event, 'x-csrf-token') || ''
  const cookie = getCookie(event, 'csrf_token') || ''
  if (!header || !cookie || header !== cookie)
    throw createError({ statusCode: 403, message: 'CSRF-Prüfung fehlgeschlagen.' })
}

export default eventHandler(async (event) => {
  if (getMethod(event) !== 'POST') {
    throw createError({ statusCode: 405, message: 'Method Not Allowed' })
  }

  assertCsrf(event)

  await destroySession(event)

  return { ok: true }
})
