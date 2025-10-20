// server/api/blob.upload.post.ts
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { defineEventHandler, readBody, createError, getRequestURL, getHeader, getCookie } from 'h3'
import { resolveSession } from '../utils/session'
import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  // 0) Voraussetzung: RW-Token vorhanden
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw createError({ statusCode: 500, message: 'BLOB_READ_WRITE_TOKEN fehlt.' })
  }

  // 1) Body vom Client-Helper übernehmen
  const body = await readBody<HandleUploadBody>(event).catch(() => null)
  if (!body) throw createError({ statusCode: 400, message: 'Ungültiger Body' })

  const isCallback = body.type === 'blob.upload-completed'

  // 2) Auth via Session oder CSRF-Token (für Registrierung ohne Session)
  const session = isCallback ? null : await resolveSession(event)
  const csrfHeader = getHeader(event, 'x-csrf-token') || ''
  const csrfCookie = getCookie(event, 'csrf_token') || ''
  const hasCsrf = Boolean(csrfHeader && csrfCookie && csrfHeader === csrfCookie)

  if (!session && !hasCsrf && !isCallback) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  // 3) Absolute Callback-URL (lokal & Vercel). Alternativ ENV: VERCEL_BLOB_CALLBACK_URL
  const origin = getRequestURL(event).origin
  const callbackUrl = process.env.VERCEL_BLOB_CALLBACK_URL || `${origin}/api/blob.upload`

  // 4) Token generieren + Upload finalisieren
  return await handleUpload({
    body,
    request: event.node.req as unknown as Request,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
      maximumSizeInBytes: 10 * 1024 * 1024,
      addRandomSuffix: true,
      tokenPayload: session?.user?.id ? JSON.stringify({ userId: session.user.id }) : undefined,
      callbackUrl,
    }),
    onUploadCompleted: async ({ blob, tokenPayload }) => {
      try {
        const payload = tokenPayload ? JSON.parse(tokenPayload) : null
        const userId: string | undefined = payload?.userId
        if (!userId) return

        // Avatar-URL direkt am User speichern
        await prisma.user.update({
          where: { id: userId },
          data: { image: blob.url },
          select: { id: true },
        })
        console.log('[blob.upload] Avatar gespeichert:', blob.url)
      } catch (e) {
        console.error('[blob.upload] onUploadCompleted Fehler:', e)
      }
    },
  })
})
