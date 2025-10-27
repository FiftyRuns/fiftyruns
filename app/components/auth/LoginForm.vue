<template>
  <div class="lg:sticky lg:top-6">
    <div class="rounded-2xl bg-white/90 shadow-xl ring-1 ring-black/5 backdrop-blur">
      <div class="p-6 sm:p-8">
        <header class="mb-6 text-center">
          <h1 class="text-2xl  font-semibold tracking-tight" :style="{ color: 'var(--color-primary)' }">
            Willkommen zurück
          </h1>
          <p class="mt-2 text-sm text-gray-600">Melde dich an, um deine Läufe und Community-Updates zu sehen.</p>
        </header>

        <div v-if="serverError" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {{ serverError }}
        </div>

        <div v-if="serverSuccess" class="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {{ serverSuccess }}
        </div>

        <form @submit.prevent="onSubmit" novalidate>
          <div class="space-y-5">
            <InputField
              id="email"
              v-model.trim="form.email"
              type="email"
              label="E-Mail"
              inputmode="email"
              autocomplete="email"
              maxlength="100"
              :error="errors.email"
            />

            <InputField
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              label="Passwort"
              autocomplete="current-password"
              minlength="8"
              maxlength="72"
              :error="errors.password"
            >
              <template #trailing>
                <button
                  type="button"
                  @click="togglePasswordVisibility"
                  class="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-900 focus:outline-none"
                  :aria-label="showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'"
                >
                  <Icon :icon="showPassword ? 'ph:eye-slash' : 'ph:eye'" class="h-5 w-5" />
                </button>
              </template>
            </InputField>

            <div class="flex items-center justify-between gap-3 text-sm">
              <CheckboxField id="remember" v-model="form.remember" label="Angemeldet bleiben" />
              <NuxtLink to="/password-reset" class="text-[var(--color-accent)] underline-offset-4 hover:underline">
                Passwort vergessen?
              </NuxtLink>
            </div>
          </div>

          <div class="mt-6 space-y-3">
            <FormButton
              type="submit"
              variant="primary"
              :loading="pending"
              loading-label="Wird geprüft…"
              label="Anmelden"
              block
            />

            <p class="text-center text-sm text-gray-600">
              Noch kein Konto?
              <NuxtLink to="/register" class="text-[var(--color-accent)] underline-offset-4 hover:underline">
                Jetzt registrieren
              </NuxtLink>
            </p>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Icon } from '@iconify/vue'
import type { AuthUser } from '../../types/auth'
import { useRouter, useRoute } from 'vue-router'
import { useAuthUser } from '../../composables/useAuthUser'
import { refreshAuthTeam } from '../../composables/useAuthTeam'

import FormButton from '../atoms/form/FormButton.vue'
import CheckboxField from '../molecules/form/CheckboxField.vue'
import InputField from '../molecules/form/InputField.vue'

const router = useRouter()
const route = useRoute()
const authUser = useAuthUser()

const form = reactive({
  email: '',
  password: '',
  remember: true,
})

const errors = reactive<Record<string, string | undefined>>({})
const serverError = ref('')
const serverSuccess = ref('')
const showPassword = ref(false)
const csrfToken = ref('')
const pending = ref(false)

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const sanitizeBasic = (input: string) =>
  input.replace(/<[^>]*>/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim()

const validate = () => {
  errors.email = undefined
  errors.password = undefined

  const email = sanitizeBasic(form.email).toLowerCase()
 if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.email = 'Bitte eine gültige E-Mail angeben.'
  }

  if (!form.password) {
    errors.password = 'Bitte Passwort eingeben.'
  }

  return Object.values(errors).every((entry) => !entry)
}

const fetchCsrf = async () => {
  const { token } = await $fetch<{ token: string }>('/api/security/csrf', { method: 'GET' })
  csrfToken.value = token
}

const onSubmit = async () => {
  serverError.value = ''
  serverSuccess.value = ''

  if (!validate()) {
    return
  }

  pending.value = true
  try {
    const result = await $fetch<{
      ok: boolean
      user: AuthUser
      expiresAt: string
    }>('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'x-csrf-token': csrfToken.value },
      body: {
        email: form.email,
        password: form.password,
        rememberMe: form.remember,
      },
    })

    if (result.ok) {
      authUser.value = result.user
      await refreshAuthTeam()
      serverSuccess.value = 'Login erfolgreich. Du wirst weitergeleitet…'
      await router.push('/postings')
    }
  } catch (error: any) {
    serverError.value = error?.data?.message || 'Login fehlgeschlagen.'
    await fetchCsrf()
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  fetchCsrf()
  if (route.query.verified === '1') {
    serverSuccess.value = 'E-Mail bestätigt! Du kannst dich jetzt anmelden.'
  } else if (route.query.loggedOut === '1') {
    serverSuccess.value = 'Du wurdest abgemeldet.'
  }
})
</script>
