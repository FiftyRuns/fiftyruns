import { eventHandler, getQuery, createError, sendRedirect, H3Event } from 'h3'
import { prisma } from '../../utils/prisma'

export default eventHandler(async (event: H3Event) => {
  const token = getQuery(event).token
  if (!token || typeof token !== 'string' || token.length < 16) {
    throw createError({ statusCode: 400, message: 'Ungültiger Token.' })
  }

  const user = await prisma.user.findFirst({ where: { emailVerificationToken: token } })
  if (!user) {
    throw createError({ statusCode: 404, message: 'Token nicht gefunden.' })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
    },
  })

  // send the user somewhere friendly after verification
  return sendRedirect(event, '/login?verified=1')
})
