// server/api/blob.delete.post.ts
import { del } from '@vercel/blob'
import { eventHandler, readBody, createError, getHeader, getCookie } from 'h3'
import { resolveSession } from '../utils/session'
import { prisma } from '../utils/prisma'

function assertCsrf(event:any){
  const h = getHeader(event,'x-csrf-token')||''
  const c = getCookie(event,'csrf_token')||''
  if(!h || !c || h!==c) throw createError({ statusCode: 403, message: 'CSRF-Prüfung fehlgeschlagen.' })
}

export default eventHandler(async (event) => {
  assertCsrf(event)
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })

  const { url } = await readBody<{ url?: string }>(event)
  if (!url) throw createError({ statusCode: 400, message: 'url fehlt' })

  await del(url) // löscht den Blob
  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: null },
    select: { id: true },
  })
  return { ok: true }
})
