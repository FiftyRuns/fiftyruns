import { createError, eventHandler, getCookie, getHeader } from 'h3'
import { del } from '@vercel/blob'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'

function assertCsrf(event: Parameters<typeof getHeader>[0]) {
  const header = getHeader(event, 'x-csrf-token') || ''
  const cookie = (getCookie(event, 'csrf_token') || '') as string
  if (!header || !cookie || header !== cookie) {
    throw createError({ statusCode: 403, message: 'CSRF-Prüfung fehlgeschlagen.' })
  }
}

function isVercelBlobUrl(url: string | null | undefined) {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.hostname.endsWith('vercel-storage.com')
  } catch {
    return false
  }
}

export default eventHandler(async (event) => {
  assertCsrf(event)

  const session = await resolveSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const membership = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { groupId: true, groupRole: true },
  })

  if (!membership?.groupId) {
    throw createError({ statusCode: 404, message: 'Du bist in keinem Team.' })
  }

  if (membership.groupRole !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Nur Team-Admins dürfen das Team löschen.' })
  }

  // Hole Team mit Cover-Image
  const group = await prisma.group.findUnique({
    where: { id: membership.groupId! },
    select: { coverImage: true },
  })

  // Lösche Team-Cover-Bild aus Blob Storage
  if (group?.coverImage && isVercelBlobUrl(group.coverImage)) {
    try {
      await del(group.coverImage)
    } catch (err) {
      console.warn('[team/delete] Team-Cover konnte nicht gelöscht werden:', err)
    }
  }

  await prisma.$transaction(async (tx) => {
    const groupId = membership.groupId!

    await tx.user.updateMany({
      where: { groupId: groupId },
      data: { groupId: null, groupRole: null },
    })

    await tx.group.delete({ where: { id: groupId } })
  })

  return { ok: true }
})