// server/api/team/invite.post.ts
import { randomBytes } from 'node:crypto'
import { eventHandler, createError, readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'
import { assertCsrf } from '../../utils/csrf'
import { sendTeamInviteEmail } from '../../utils/sendTeamInviteEmail'

type Body = {
  email?: string | null
  userId?: string | null
  note?: string | null
  expiresInDays?: number
}

function sanitizeEmail(email?: string | null) {
  if (!email) return null
  const cleaned = email.trim().toLowerCase()
  return cleaned || null
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default eventHandler(async (event) => {
  assertCsrf(event)

  const session = await resolveSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const body = (await readBody<Body>(event)) || {}
  const email = sanitizeEmail(body.email)
  const note = body.note?.trim() || null
  const targetUserId = body.userId?.trim() || null

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { groupId: true, groupRole: true },
  })

  if (!admin?.groupId) {
    throw createError({ statusCode: 400, message: 'Du bist in keinem Team.' })
  }
  if (admin.groupRole !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Nur Team-Admins können Einladungen versenden.' })
  }

  const group = await prisma.group.findUnique({
    where: { id: admin.groupId },
    select: { maxMembers: true, name: true },
  })
  if (!group) {
    throw createError({ statusCode: 404, message: 'Team nicht gefunden.' })
  }

  const currentMemberCount = await prisma.user.count({ where: { groupId: admin.groupId } })
  if (group.maxMembers != null && currentMemberCount >= group.maxMembers) {
    throw createError({ statusCode: 400, message: 'Dieses Team hat die maximale Größe erreicht.' })
  }

  let targetEmail = email

  if (targetUserId) {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, groupId: true },
    })
    if (!targetUser) {
      throw createError({ statusCode: 404, message: 'Nutzer wurde nicht gefunden.' })
    }
    if (targetUser.groupId) {
      throw createError({ statusCode: 400, message: 'Diese Person ist bereits in einem Team.' })
    }
    if (targetUser.id === session.user.id) {
      throw createError({ statusCode: 400, message: 'Du kannst dich nicht selbst einladen.' })
    }
    targetEmail = targetUser.email ? targetUser.email.toLowerCase() : targetEmail
  }

  if (!targetEmail) {
    throw createError({ statusCode: 400, message: 'E-Mail oder Nutzer ist erforderlich.' })
  }

  if (!isValidEmail(targetEmail)) {
    throw createError({ statusCode: 400, message: 'Ungültige E-Mail-Adresse.' })
  }

  // Check if user is already a member
  const alreadyMember = await prisma.user.findFirst({
    where: { email: targetEmail, groupId: admin.groupId },
    select: { id: true },
  })
  if (alreadyMember) {
    throw createError({ statusCode: 400, message: 'Diese E-Mail gehört bereits zu einem Teammitglied.' })
  }

  // Check for duplicate invites
  const duplicateTarget = targetUserId
    ? await prisma.groupInvite.findFirst({
        where: {
          groupId: admin.groupId,
          targetUserId,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
      })
    : null
  if (duplicateTarget) {
    throw createError({ statusCode: 400, message: 'Für diese Person existiert bereits eine aktive Einladung.' })
  }

  const duplicateEmail = await prisma.groupInvite.findFirst({
    where: {
      groupId: admin.groupId,
      email: targetEmail,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  })
  if (duplicateEmail) {
    throw createError({ statusCode: 400, message: 'Für diese E-Mail existiert bereits eine aktive Einladung.' })
  }

  // Check active invites count
  const now = Date.now()
  const activeInvitesCount = await prisma.groupInvite.count({
    where: {
      groupId: admin.groupId,
      acceptedAt: null,
      expiresAt: { gt: new Date(now) },
    },
  })

  if (activeInvitesCount >= 25) {
    throw createError({
      statusCode: 400,
      message: 'Du hast bereits viele offene Einladungen. Bitte lösche zuerst einige.',
    })
  }

  // Create invite
  const expiresAt = new Date(
    now +
      (Number.isFinite(body.expiresInDays)
        ? Math.min(Math.max(Math.trunc(body.expiresInDays ?? 7), 1), 30)
        : 7) *
        24 *
        60 *
        60 *
        1000,
  )
  const token = randomBytes(24).toString('hex')

  const invite = await prisma.groupInvite.create({
    data: {
      groupId: admin.groupId,
      invitedById: session.user.id,
      targetUserId,
      email: targetEmail,
      note,
      token,
      expiresAt,
    },
    include: {
      invitedBy: { select: { id: true, name: true, nameId: true, email: true } },
      targetUser: { select: { id: true, name: true, nameId: true, email: true } },
    },
  })

  if (invite.email) {
    try {
      await sendTeamInviteEmail({
        to: invite.email,
        teamName: group.name,
        token: invite.token,
        inviterName: session.user.name ?? 'Ein Teammitglied',
        note,
      })
    } catch (mailError) {
      console.error('[team-invite-email] Versand fehlgeschlagen', mailError)
    }
  }

  return {
    ok: true,
    invite: {
      id: invite.id,
      email: invite.email ?? '',
      note: invite.note ?? '',
      token: invite.token,
      status: 'pending',
      expiresAt: invite.expiresAt.toISOString(),
      invitedAt: invite.createdAt.toISOString(),
      invitedBy: invite.invitedBy
        ? {
            id: invite.invitedBy.id,
            name: invite.invitedBy.name,
            nameId: invite.invitedBy.nameId,
            email: invite.invitedBy.email,
          }
        : null,
      targetUser: invite.targetUser
        ? {
            id: invite.targetUser.id,
            name: invite.targetUser.name,
            nameId: invite.targetUser.nameId,
            email: invite.targetUser.email,
          }
        : null,
    },
  }
})
