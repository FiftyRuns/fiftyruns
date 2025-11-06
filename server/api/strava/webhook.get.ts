import { createError, eventHandler, getQuery } from 'h3'
import { prisma } from '../../utils/prisma'
import { getStravaWebhookConfig } from '../../utils/strava'

export default eventHandler(async (event) => {
  const config = getStravaWebhookConfig()
  const { verifyToken, callbackUrl } = config
  const query = getQuery(event)

  const verify = typeof query['hub.verify_token'] === 'string' ? query['hub.verify_token'] : ''
  const challenge = typeof query['hub.challenge'] === 'string' ? query['hub.challenge'] : ''
  const subscriptionIdRaw = query['hub.subscription_id'] ?? query['hub.subscription']
  const mode = typeof query['hub.mode'] === 'string' ? query['hub.mode'] : ''

  if (!challenge) {
    throw createError({ statusCode: 400, message: 'hub.challenge fehlt.' })
  }

  if (!verify || verify !== verifyToken) {
    throw createError({ statusCode: 403, message: 'Verify-Token ungültig.' })
  }

  if (subscriptionIdRaw && typeof subscriptionIdRaw === 'string') {
    const subscriptionId = Number(subscriptionIdRaw)
    if (Number.isFinite(subscriptionId)) {
      await prisma.stravaWebhookSubscription.upsert({
        where: { stravaSubscriptionId: subscriptionId },
        update: { active: true },
        create: {
          stravaSubscriptionId: subscriptionId,
          callbackUrl,
          verifyToken,
          active: true,
        },
      })
    }
  }

  if (process.dev) {
    console.info('[strava-webhook] Validation request accepted', { mode })
  }

  return { 'hub.challenge': challenge }
})
