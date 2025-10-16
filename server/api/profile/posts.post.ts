import { createError, eventHandler, getCookie, getHeader, readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'

type CreatePostBody = {
  content: string
  visibility?: 'public' | 'protected' | 'private'
  image?: string | null
}

function assertCsrf(event: Parameters<typeof getHeader>[0]) {
  const header = getHeader(event, 'x-csrf-token') || ''
  const cookie = getCookie(event, 'csrf_token') || ''
  if (!header || !cookie || header !== cookie) {
    throw createError({ statusCode: 403, message: 'CSRF-Prüfung fehlgeschlagen.' })
  }
}

export default eventHandler(async (event) => {
  assertCsrf(event)

  const session = await resolveSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const body = (await readBody<CreatePostBody>(event)) || {}
  const content = (body.content || '').trim()
  if (!content) {
    throw createError({ statusCode: 400, message: 'Beitragsinhalt darf nicht leer sein.' })
  }

  const visibility = body.visibility ?? 'protected'
  if (!['public', 'protected', 'private'].includes(visibility)) {
    throw createError({ statusCode: 400, message: 'Ungültige Sichtbarkeit.' })
  }

  const now = new Date()
  const season = `${now.getFullYear()}`

  const post = await prisma.posting.create({
    data: {
      userId: session.user.id,
      date: now,
      text: content,
      image: body.image ?? null,
      visibility,
      season,
    },
    select: {
      id: true,
      date: true,
      text: true,
      visibility: true,
      _count: {
        select: {
          reactions: true,
          comments: true,
        },
      },
    },
  })

  return {
    id: post.id,
    createdAt: post.date.toISOString(),
    text: post.text,
    visibility: post.visibility,
    reactions: post._count.reactions,
    comments: post._count.comments,
  }
})
