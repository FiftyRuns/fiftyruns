import { ref } from 'vue'
import { useRouter } from '#imports'
import { useAuthUser } from './useAuthUser'
import { setAuthTeam } from './useAuthTeam'

type LogoutOptions = {
  redirectTo?: string
}

export const useLogout = () => {
  const router = useRouter()
  const authUser = useAuthUser()

  const pending = ref(false)
  const error = ref<string>('')
  const csrfToken = ref<string>('')

  const fetchCsrf = async () => {
    const { token } = await $fetch<{ token: string }>('/api/security/csrf', {
      method: 'GET',
      credentials: 'include',
    })
    csrfToken.value = token
    return token
  }

  const logout = async (options: LogoutOptions = {}) => {
    if (pending.value) return false

    pending.value = true
    error.value = ''

    try {
      const token = csrfToken.value || (await fetchCsrf())
      await $fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'x-csrf-token': token },
        credentials: 'include',
      })

      authUser.value = null
      setAuthTeam(null)

      if (options.redirectTo) {
        await router.push(options.redirectTo)
      }

      return true
    } catch (err: any) {
      error.value = err?.data?.message || 'Abmeldung fehlgeschlagen.'
      await fetchCsrf()
      return false
    } finally {
      pending.value = false
    }
  }

  return {
    pending,
    error,
    logout,
  }
}
