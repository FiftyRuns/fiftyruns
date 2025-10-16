import { useRequestEvent, useNuxtApp } from '#imports'
import type { AuthUser } from '~/types/auth'

export default defineNuxtPlugin(async () => {
  const userState = useAuthUser()

  if (import.meta.server) {
    const event = useRequestEvent()
    userState.value = event?.context.auth?.user ?? null
    return
  }

  const nuxtApp = useNuxtApp()
  if (nuxtApp.payload?.state?.['auth-user'] !== undefined) {
    return
  }

  if (userState.value !== null) {
    return
  }

  try {
    const { data } = await useFetch<{ user: AuthUser | null }>('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
    })
    userState.value = data.value?.user ?? null
  } catch (error) {
    console.warn('Failed to load auth state', error)
    userState.value = null
  }
})
