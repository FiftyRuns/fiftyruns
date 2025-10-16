import type { AuthUser } from '../types/auth'
import { useState } from "nuxt/app"

export const useAuthUser = () =>
  useState<AuthUser | null>('auth-user', () => null)
