import { eventHandler } from 'h3'

export default eventHandler((event) => {
  if (!event.context.auth) {
    return { user: null }
  }

  return {
    user: event.context.auth.user,
    expiresAt: event.context.auth.expiresAt,
  }
})
