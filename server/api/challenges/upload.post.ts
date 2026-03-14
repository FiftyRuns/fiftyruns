// server/api/challenges/upload.post.ts
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { defineEventHandler, readBody, createError, getHeader, getCookie } from 'h3'
import { resolveSession } from '../../utils/session'
import { getBlobCallbackUrl } from '../../utils/blobCallbackUrl'

export default defineEventHandler(async (event) => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw createError({ statusCode: 500, message: 'BLOB_READ_WRITE_TOKEN fehlt.' })
  }

  const body = await readBody<HandleUploadBody>(event).catch(() => null)
  if (!body) throw createError({ statusCode: 400, message: 'Ungültiger Body' })

  const isCallback = body.type === 'blob.upload-completed'

  // Auth via Session oder CSRF-Token
  const session = isCallback ? null : await resolveSession(event)
  const csrfHeader = getHeader(event, 'x-csrf-token') || ''
  const csrfCookie = getCookie(event, 'csrf_token') || ''
  const hasCsrf = Boolean(csrfHeader && csrfCookie && csrfHeader === csrfCookie)

  if (!session && !hasCsrf && !isCallback) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const callbackUrl = getBlobCallbackUrl(event, '/api/challenges/upload')

  return await handleUpload({
    body,
    request: event.node.req as unknown as Request,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
      maximumSizeInBytes: 10 * 1024 * 1024, // 10MB
      addRandomSuffix: true,
      tokenPayload: session?.user?.id ? JSON.stringify({ userId: session.user.id }) : undefined,
      callbackUrl,
    }),
  })
})

