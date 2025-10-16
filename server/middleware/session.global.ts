import { eventHandler } from 'h3'
import { resolveSession } from '../utils/session'

export default eventHandler(async (event) => {
  const session = await resolveSession(event)
  if (session) {
    event.context.auth = {
      user: session.user,
      token: session.token,
      expiresAt: session.expiresAt,
    }
  } else {
    event.context.auth = null
  }
})
