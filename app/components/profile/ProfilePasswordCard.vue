<template>
  <ProfilePanel title="Passwort aktualisieren" description="Wähle ein starkes Passwort, um dein Konto zu schützen.">
    <form class="space-y-5" @submit.prevent="onSubmit">
      <InputField
        id="password-current"
        :model-value="form.currentPassword"
        label="Aktuelles Passwort"
        :type="showCurrent ? 'text' : 'password'"
        autocomplete="current-password"
        @update:model-value="updateField('currentPassword', $event)"
      >
        <template #trailing>
          <button
            type="button"
            class="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-800 focus:outline-none"
            :aria-label="showCurrent ? 'Passwort verbergen' : 'Passwort anzeigen'"
            @click="showCurrent = !showCurrent"
          >
            <Icon :icon="showCurrent ? 'ph:eye-slash' : 'ph:eye'" class="h-5 w-5" />
          </button>
        </template>
      </InputField>

      <div class="grid gap-5 md:grid-cols-2">
        <InputField
          id="password-new"
          :model-value="form.newPassword"
          label="Neues Passwort"
          :type="showNew ? 'text' : 'password'"
          autocomplete="new-password"
          minlength="8"
          @update:model-value="updateField('newPassword', $event)"
        >
          <template #trailing>
            <button
              type="button"
              class="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-800 focus:outline-none"
              :aria-label="showNew ? 'Passwort verbergen' : 'Passwort anzeigen'"
              @click="showNew = !showNew"
            >
              <Icon :icon="showNew ? 'ph:eye-slash' : 'ph:eye'" class="h-5 w-5" />
            </button>
          </template>
        </InputField>

        <InputField
          id="password-confirm"
          :model-value="form.confirmPassword"
          label="Neues Passwort bestätigen"
          :type="showConfirm ? 'text' : 'password'"
          autocomplete="new-password"
          minlength="8"
          :error="passwordMismatch ? 'Passwörter stimmen nicht überein.' : ''"
          @update:model-value="updateField('confirmPassword', $event)"
        >
          <template #trailing>
            <button
              type="button"
              class="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-800 focus:outline-none"
              :aria-label="showConfirm ? 'Passwort verbergen' : 'Passwort anzeigen'"
              @click="showConfirm = !showConfirm"
            >
              <Icon :icon="showConfirm ? 'ph:eye-slash' : 'ph:eye'" class="h-5 w-5" />
            </button>
          </template>
        </InputField>
      </div>

      <ul class="grid gap-2 rounded-2xl border border-dashed border-black/10 bg-white/70 p-4 text-xs text-gray-500 sm:grid-cols-2">
        <li class="flex items-center gap-2">
          <Icon icon="ph:check-circle-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
          Mindestens 8 Zeichen, besser 12+
        </li>
        <li class="flex items-center gap-2">
          <Icon icon="ph:check-circle-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
          Groß- und Kleinbuchstaben kombinieren
        </li>
        <li class="flex items-center gap-2">
          <Icon icon="ph:check-circle-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
          Zahlen und Sonderzeichen einbauen
        </li>
        <li class="flex items-center gap-2">
          <Icon icon="ph:check-circle-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
          Nicht mehrfach nutzen oder weitergeben
        </li>
      </ul>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <p v-if="successMessage" class="text-xs font-medium text-green-600">{{ successMessage }}</p>
        <p v-else-if="errorMessage" class="text-xs font-medium text-red-600">{{ errorMessage }}</p>
        <FormButton type="submit" variant="secondary" :loading="loading" label="Passwort speichern" />
      </div>
    </form>
  </ProfilePanel>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import InputField from '../molecules/form/InputField.vue'
import ProfilePanel from '../profile/ProfilePanel.vue'
import FormButton from '../atoms/form/FormButton.vue'

type PasswordForm = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const props = withDefaults(
  defineProps<{
    modelValue: PasswordForm
    loading?: boolean
    errorMessage?: string
    successMessage?: string
  }>(),
  {
    loading: false,
    errorMessage: '',
    successMessage: '',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: PasswordForm): void
  (e: 'submit', value: PasswordForm): void
}>()

const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

const form = computed(() => props.modelValue)

const passwordMismatch = computed(
  () => form.value.newPassword && form.value.confirmPassword && form.value.newPassword !== form.value.confirmPassword,
)

function updateField<Key extends keyof PasswordForm>(key: Key, value: PasswordForm[Key]) {
  emit('update:modelValue', { ...form.value, [key]: value })
}

function onSubmit() {
  emit('submit', form.value)
}
</script>
