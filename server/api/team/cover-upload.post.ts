// server/api/team/cover-upload.post.ts
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

  const session = await resolveSession(event)
  if (!session) {
    const header = getHeader(event, 'x-csrf-token') || ''
    const cookie = getCookie(event, 'csrf_token') || ''
    if (!header || !cookie || header !== cookie) {
      throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
    }
  }

  const callbackUrl = getBlobCallbackUrl(event, '/api/team/cover-upload')

  return await handleUpload({
    body,
    request: event.node.req as unknown as Request,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
      maximumSizeInBytes: 8 * 1024 * 1024,
      addRandomSuffix: true,
      callbackUrl,
    }),
  })
})
