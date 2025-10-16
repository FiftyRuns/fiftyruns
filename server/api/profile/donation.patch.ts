import { createError, eventHandler, getCookie, getHeader, readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'

const AMOUNT_TO_MULTIPLIER: Record<number, 'x1' | 'x2' | 'x5' | 'x10'> = {
  1: 'x1',
  2: 'x2',
  5: 'x5',
  10: 'x10',
}

type UpdateDonationBody = {
  amount: number
  autoDonate?: boolean
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

  const body = await readBody<UpdateDonationBody>(event)
  const multiplier = AMOUNT_TO_MULTIPLIER[body?.amount ?? 0]
  if (!multiplier) {
    throw createError({ statusCode: 400, message: 'Ungültiger Spendenbetrag.' })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      runDonationMultiplier: multiplier,
      autoDonate: Boolean(body?.autoDonate),
      donationUpdatedAt: new Date(),
    },
  })

  return { ok: true }
})
