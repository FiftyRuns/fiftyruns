// server/api/team/invite/[token].get.ts
import { eventHandler, createError, getRouterParams } from 'h3'
import { prisma } from '../../../utils/prisma'

export default eventHandler(async (event) => {
  // Try multiple ways to get the parameter
  const params = getRouterParams(event)
  const tokenFromParams = params.token
  const tokenFromContext = event.context.params?.token
  
  // Additional extraction methods
  const url = event.node.req.url
  let tokenFromUrl: string | undefined
  if (url) {
    const urlParts = url.split('/')
    tokenFromUrl = urlParts[urlParts.length - 1]
  }

  // Try all possible token sources
  const token = (tokenFromParams || tokenFromContext || tokenFromUrl) as string | undefined
  
  if (!token) {
    throw createError({ 
      statusCode: 400, 
      message: 'Einladungstoken fehlt.' 
    })
  }

  // Clean the token
  const cleanToken = token.trim()
  if (!cleanToken) {
    throw createError({ 
      statusCode: 400, 
      message: 'Einladungstoken fehlt.' 
    })
  }

  try {
    const invite = await prisma.groupInvite.findUnique({
      where: { token: cleanToken },
      include: {
        group: {
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
          },
        },
        targetUser: {
          select: {
            id: true,
            name: true,
            nameId: true,
            email: true,
          },
        },
      },
    })

    if (!invite) {
      throw createError({ 
        statusCode: 404, 
        message: 'Einladung nicht gefunden.' 
      })
    }

    const now = Date.now()
    const expired = invite.expiresAt.getTime() < now
    const accepted = Boolean(invite.acceptedAt)

    return {
      invite: {
        id: invite.id,
        email: invite.email ?? '',
        note: invite.note ?? '',
        status: accepted ? 'accepted' : expired ? 'expired' : 'pending',
        expiresAt: invite.expiresAt.toISOString(),
        targetUser: invite.targetUser
          ? {
              id: invite.targetUser.id,
              name: invite.targetUser.name,
              nameId: invite.targetUser.nameId,
              email: invite.targetUser.email ?? '',
            }
          : null,
        targetUserId: invite.targetUserId,
        group: {
          id: invite.group.id,
          name: invite.group.name,
          nameId: invite.group.nameId,
          description: invite.group.description ?? '',
          location: invite.group.location ?? '',
          coverImage: invite.group.coverImage ?? '',
          visibility: invite.group.visibility,
          requireApproval: invite.group.requireApproval,
          maxMembers: invite.group.maxMembers,
        },
      },
    }

  } catch (error) {
    // Re-throw known errors, create new for unexpected ones
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    
    throw createError({ 
      statusCode: 500, 
      message: 'Interner Serverfehler beim Abrufen der Einladung.' 
    })
  }
})