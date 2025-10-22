<template>
  <div class="lg:sticky lg:top-6">
    <div class="rounded-2xl bg-white/90 shadow-xl ring-1 ring-black/5 backdrop-blur">
      <div class="p-6 sm:p-8">
        <div class="mb-6 text-center">
          <h1 class="text-2xl  font-semibold tracking-tight" :style="{ color: 'var(--color-primary)' }">
            Konto erstellen
          </h1>
          <p class="mt-2 text-sm text-gray-600">Registriere dich, um 50runs zu nutzen.</p>
        </div>

        <div v-if="serverError" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {{ serverError }}
        </div>
        <div v-if="serverSuccess"
          class="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {{ serverSuccess }}
        </div>

        <form @submit.prevent="onSubmit" novalidate>
          <div class="space-y-5">
            <ProfileImagePicker v-model="form.profilePicture" v-model:imageUrl="form.avatarUrl"
              :max-size="MAX_PROFILE_IMAGE_SIZE"
              :auto-upload="true"
              handle-upload-url="/api/blob.upload"
              :csrf-token="csrfToken"
              @error="(m) => (errors.profilePicture = m)"
            />

              <InputField id="name" v-model.trim="form.name" label="Benutzername" autocomplete="username"
                inputmode="text" maxlength="32" :error="errors.name"
                hint='Nur Kleinbuchstaben, Zahlen und Bindestriche. Beispiel: "max-mustermann"'
                @blur="syncNameIdFromName" />

              <InputField id="email" v-model.trim="form.email" label="E-Mail" type="email" inputmode="email"
                autocomplete="email" maxlength="100" :error="errors.email" />

              <InputField id="password" v-model="form.password" :type="showPassword ? 'text' : 'password'"
                label="Passwort" autocomplete="new-password" minlength="8" maxlength="72" :error="errors.password"
                hint="Mind. 8 Zeichen, Groß-/Kleinbuchstaben, Zahl und Sonderzeichen.">
                <template #trailing>
                  <button type="button" @click="togglePasswordVisibility"
                    class="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-900 focus:outline-none"
                    :aria-label="showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'">
                    <Icon :icon="showPassword ? 'ph:eye-slash' : 'ph:eye'" class="h-5 w-5" />
                  </button>
                </template>
              </InputField>

              <InputField id="passwordConfirm" v-model="form.passwordConfirm" :type="showPassword ? 'text' : 'password'"
                label="Passwort wiederholen" autocomplete="new-password" minlength="8" maxlength="72"
                :error="errors.passwordConfirm" />

              <CheckboxField id="tos" v-model="form.accept" :error="errors.accept"
                error-class="-mt-2 text-xs text-red-600">
                Ich akzeptiere die Nutzungsbedingungen und Datenschutzbestimmungen.
              </CheckboxField>
          </div>

          <div class="mt-6">
            <FormButton type="submit" variant="primary" :loading="pending" loading-label="Wird erstellt…"
              label="Registrieren" block />
          </div>

          <p class="mt-6 text-center text-sm" :style="{ color: 'var(--color-accent)' }">
            Bereits ein Konto?
            <NuxtLink to="/login" class="underline">Zum Login</NuxtLink>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Icon } from '@iconify/vue'
import FormButton from '../atoms/form/FormButton.vue'
import CheckboxField from '../molecules/form/CheckboxField.vue'
import InputField from '../molecules/form/InputField.vue'
import ProfileImagePicker from '../molecules/form/ProfileImagePicker.vue'

const MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024 // 2 MB

const form = reactive({
  name: '',
  nameId: '',
  email: '',
  password: '',
  passwordConfirm: '',
  accept: false,
  profilePicture: null as File | null,
  avatarUrl: null as string | null, 
})

const errors = reactive<Record<string, string | undefined>>({})
const serverError = ref('')
const serverSuccess = ref('')
const pending = ref(false)
const showPassword = ref(false)
const csrfToken = ref('')

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const sanitizeBasic = (input: string) =>
  input.replace(/<[^>]*>/g, '').replace(/[\u0000-\u001f\u007f]/g, '').trim()

const slugify = (value: string) =>
  sanitizeBasic(value)
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9\-\s_]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/\-+/g, '-')
    .replace(/^-|-$/g, '')

const syncNameIdFromName = () => {
  if (!form.nameId) {
    form.nameId = slugify(form.name).slice(0, 32)
  }
}

const validate = () => {
  errors.name = undefined
  errors.nameId = undefined
  errors.email = undefined
  errors.password = undefined
  errors.passwordConfirm = undefined
  errors.accept = undefined

  const name = slugify(form.name)
  if (!name || !/^[a-z0-9](?:[a-z0-9-]{1,30})[a-z0-9]$/.test(name)) {
    errors.name = 'Benutzername: 2–32 Zeichen, nur a–z, 0–9, Bindestrich (nicht am Rand).'
  }

  const email = sanitizeBasic(form.email)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.email = 'Bitte eine gültige E-Mail angeben.'
  }

  const pwd = form.password
  const hasLen = pwd.length >= 8
  const hasUpper = /[A-Z]/.test(pwd)
  const hasLower = /[a-z]/.test(pwd)
  const hasDigit = /\d/.test(pwd)
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd)

  if (!(hasLen && hasUpper && hasLower && hasDigit && hasSpecial)) {
    errors.password =
      'Passwort muss mindestens 8 Zeichen enthalten und Großbuchstaben, Kleinbuchstaben, Zahl sowie Sonderzeichen beinhalten.'
  }

  if (!form.passwordConfirm) {
    errors.passwordConfirm = 'Bitte das Passwort erneut eingeben.'
  } else if (form.password !== form.passwordConfirm) {
    errors.passwordConfirm = 'Passwörter stimmen nicht überein.'
  }

  if (!form.accept) {
    errors.accept = 'Bitte Bedingungen akzeptieren.'
  }

  return Object.values(errors).every((entry) => !entry)
}

const fetchCsrf = async () => {
  const { token } = await $fetch<{ token: string }>('/api/security/csrf', { method: 'GET' })
  csrfToken.value = token
}

if (process.client) {
  fetchCsrf()
}

const onSubmit = async () => {
  serverError.value = ''
  serverSuccess.value = ''

  if (!validate()) {
    return
  }

  pending.value = true
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'x-csrf-token': csrfToken.value },
      body: {
        name: form.name,
        nameId: form.nameId,
        email: form.email,
        password: form.password,
        avatarUrl: form.avatarUrl,
      },
    })
    serverSuccess.value = 'Registrierung erfolgreich. Bitte E-Mail prüfen und Konto bestätigen.'
  } catch (error: any) {
    serverError.value = error?.data?.message || 'Registrierung fehlgeschlagen.'
  } finally {
    pending.value = false
  }
}

</script>
