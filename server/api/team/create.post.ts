// server/api/team/create.post.ts
import { randomBytes } from 'node:crypto'
import { eventHandler, readBody, createError, getCookie, getHeader } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'
import { sendTeamInviteEmail } from '../../utils/sendTeamInviteEmail'

function assertCsrf(event: Parameters<typeof getHeader>[0]) {
  const header = getHeader(event, 'x-csrf-token') || ''
  const cookie = getCookie(event, 'csrf_token') || ''
  if (!header || !cookie || header !== cookie) {
    throw createError({ statusCode: 403, message: 'CSRF-Prüfung fehlgeschlagen.' })
  }
}

type Body = {
  name: string
  nameId?: string
  description?: string | null
  location?: string | null
  coverImage?: string | null
  visibility?: 'public' | 'protected' | 'private'
  requireApproval?: boolean
  maxMembers?: number | null
  invites?: {
    userIds?: string[]
    emails?: Array<{ email: string; note?: string }>
  }
}

const VISIBILITY_OPTIONS = new Set(['public', 'protected', 'private'])
const INVITE_EXPIRY_DAYS = 14

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function ensureNameIdAvailable(nameId: string) {
  const existing = await prisma.group.findUnique({ where: { nameId } })
  if (existing) {
    throw createError({ statusCode: 400, message: 'Dieser Team-Slug ist bereits vergeben.' })
  }
}

function buildToken() {
  return randomBytes(24).toString('hex')
}

export default eventHandler(async (event) => {
  assertCsrf(event)
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })

  const body = (await readBody<Body>(event)) || {}
  if (!body.name) {
    throw createError({ statusCode: 400, message: 'Teamname ist erforderlich.' })
  }

  const visibility = body.visibility ?? 'public'
  if (!VISIBILITY_OPTIONS.has(visibility)) {
    throw createError({ statusCode: 400, message: 'Ungültige Sichtbarkeit.' })
  }

  const requireApproval =
    typeof body.requireApproval === 'boolean' ? body.requireApproval : visibility !== 'public'

  const maxMembers =
    body.maxMembers != null
      ? Number.parseInt(String(body.maxMembers), 10)
      : null

  if (maxMembers != null && (!Number.isFinite(maxMembers) || maxMembers < 2 || maxMembers > 500)) {
    throw createError({ statusCode: 400, message: 'Maximale Teamgröße muss zwischen 2 und 500 liegen.' })
  }

  let nameId = body.nameId?.trim()
  if (!nameId) {
    nameId = slugify(body.name)
  } else {
    nameId = slugify(nameId)
  }
  if (!nameId) {
    throw createError({ statusCode: 400, message: 'Team-Slug konnte nicht erzeugt werden. Bitte gib einen gültigen Wert ein.' })
  }

  await ensureNameIdAvailable(nameId)

  // ensure user not already in a team
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { groupId: true },
  })
  if (me?.groupId) throw createError({ statusCode: 400, message: 'Du bist bereits in einem Team.' })

  const now = Date.now()
  const expiresAt = new Date(now + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

  const inviteUserIds = Array.from(new Set(body.invites?.userIds ?? [])).filter((id) => id !== session.user.id)
  const inviteEmails = (body.invites?.emails ?? [])
    .map((entry) => ({ email: entry.email?.trim().toLowerCase() ?? '', note: (entry.note ?? '').trim() }))
    .filter((entry) => entry.email)

  for (const entry of inviteEmails) {
    if (!validateEmail(entry.email)) {
      throw createError({ statusCode: 400, message: `Ungültige E-Mail-Adresse: ${entry.email}` })
    }
  }

  const emailNotifications: Array<{ email: string; token: string; note?: string | null }> = []

  const created = await prisma.$transaction(async (tx) => {
    const group = await tx.group.create({
      data: {
        name: body.name,
        nameId,
        description: body.description ?? null,
        location: body.location ?? null,
        coverImage: body.coverImage ?? null,
        visibility,
        requireApproval,
        maxMembers,
      },
      select: {
        id: true,
        name: true,
        nameId: true,
        description: true,
        location: true,
        coverImage: true,
        visibility: true,
        requireApproval: true,
        maxMembers: true,
        _count: { select: { users: true } },
      },
    })

    await tx.user.update({
      where: { id: session.user.id },
      data: { groupId: group.id, groupRole: 'ADMIN' },
    })

    if (inviteUserIds.length) {
      const users = await tx.user.findMany({
        where: { id: { in: inviteUserIds } },
        select: { id: true, email: true, groupId: true },
      })

      for (const user of users) {
        if (user.groupId) {
          continue
        }
        const invite = await tx.groupInvite.create({
          data: {
            groupId: group.id,
            invitedById: session.user.id,
            targetUserId: user.id,
            email: user.email,
            token: buildToken(),
            note: null,
            expiresAt,
          },
          select: { email: true, token: true },
        })
        if (invite.email) {
          emailNotifications.push({ email: invite.email, token: invite.token })
        }
      }
    }

    if (inviteEmails.length) {
      for (const entry of inviteEmails) {
        const invite = await tx.groupInvite.create({
          data: {
            groupId: group.id,
            invitedById: session.user.id,
            email: entry.email,
            note: entry.note || null,
            token: buildToken(),
            expiresAt,
          },
          select: { email: true, token: true },
        })
        if (invite.email) {
          emailNotifications.push({ email: invite.email, token: invite.token, note: entry.note || null })
        }
      }
    }

    return group
  })

  if (emailNotifications.length) {
    await Promise.all(
      emailNotifications.map(async (invite) => {
        try {
          await sendTeamInviteEmail({
            to: invite.email,
            teamName: created.name,
            token: invite.token,
            inviterName: session.user.name ?? 'Ein Teammitglied',
            note: invite.note ?? null,
          })
        } catch (mailError) {
          console.error('[team-invite-email] Versand fehlgeschlagen', mailError)
        }
      }),
    )
  }

  return {
    ok: true,
    team: {
      name: created.name,
      nameId: created.nameId,
      description: created.description ?? '',
      location: created.location ?? '',
      coverImage: created.coverImage ?? '',
      visibility: created.visibility,
      requireApproval: created.requireApproval,
      maxMembers: created.maxMembers,
      members: created._count.users,
      roleLabel: 'Admin',
    },
  }
})
