import type { AuthUser } from '~/types/auth'

declare module 'h3' {
  interface H3EventContext {
    auth: {
      user: AuthUser
      token: string
      expiresAt: Date
    } | null
  }
}
