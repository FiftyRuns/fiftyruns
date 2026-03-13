<template>
  <ProfilePanel title="Persönliche Einstellungen" description="Passe deine öffentlichen Profilinformationen an." :collapsible="props.collapsible" :default-open="props.defaultOpen">
    <form class="space-y-6" @submit.prevent="onSubmit">
      <div class="grid gap-5 md:grid-cols-2">
        <InputField
          id="profile-name"
          :model-value="form.name"
          label="Anzeigename"
          maxlength="60"
          @update:model-value="updateField('name', $event)"
        />

        <InputField
          id="profile-email"
          :model-value="form.email"
          type="email"
          label="E-Mail"
          autocomplete="email"
          @update:model-value="updateField('email', $event)"
        />
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between gap-2">
          <label for="profile-bio" class="text-sm font-medium text-gray-700">Über dich</label>
          <button
            type="button"
            class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 px-2.5 py-1 text-xs font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/10 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="aiLoading"
            @click="reformulateWithAi"
          >
            <svg v-if="!aiLoading" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
            <svg v-else class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            {{ aiLoading ? 'Wird generiert…' : 'Mit KI ausformulieren' }}
          </button>
        </div>
        <textarea
          id="profile-bio"
          rows="4"
          :value="form.bio"
          class="w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
          maxlength="280"
          placeholder="Beschreibe kurz deine Ziele, Motivation oder Highlights."
          @input="updateField('bio', ($event.target as HTMLTextAreaElement).value)"
        />
        <p class="mt-1 text-xs text-gray-400">Maximal 280 Zeichen.</p>
        <p v-if="aiError" class="mt-1 text-xs text-red-600">{{ aiError }}</p>
      </div>

      <div class="grid gap-5 sm:grid-cols-2">
        <div class="rounded-2xl border border-black/5 bg-white/70 p-4 shadow-sm">
          <h3 class="text-sm font-semibold text-black">Sichtbarkeit</h3>
          <p class="mt-2 text-sm text-gray-600">Bestimme, wer dein Profil sehen darf.</p>
          <select
            class="mt-3 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
            :value="form.visibility"
            @change="onVisibilityChange"
          >
            <option value="public">Öffentlich</option>
            <option value="protected">Nur Community</option>
            <option value="private">Privat</option>
          </select>
        </div>

        <div class="rounded-2xl border border-black/5 bg-white/70 p-4 shadow-sm">
          <h3 class="text-sm font-semibold text-black">Benachrichtigungen</h3>
          <p class="mt-2 text-sm text-gray-600">Erhalte Updates zu Reaktionen, Erwähnungen und Team-Aktivitäten.</p>
          <label class="mt-3 flex items-center gap-2 text-sm text-gray-700">
            <input
              class="h-4 w-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]/40"
              type="checkbox"
              :checked="form.notifications"
              @change="updateField('notifications', ($event.target as HTMLInputElement).checked)"
            />
            Notifications-Center aktivieren
          </label>
        </div>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="space-y-1">
          <p class="text-xs text-gray-500">Zuletzt aktualisiert {{ lastUpdated }}</p>
          <p v-if="successMessage" class="text-xs font-medium text-green-600">{{ successMessage }}</p>
          <p v-else-if="errorMessage" class="text-xs font-medium text-red-600">{{ errorMessage }}</p>
        </div>
        <FormButton type="submit" variant="primary" :loading="loading" label="Änderungen speichern" />
      </div>
    </form>
  </ProfilePanel>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import InputField from '../molecules/form/InputField.vue'
import ProfilePanel from './ProfilePanel.vue'
import FormButton from '../atoms/form/FormButton.vue'
import type { ProfileSettings } from '../../types/profile'

const props = withDefaults(
  defineProps<{
    modelValue: ProfileSettings
    loading?: boolean
    successMessage?: string
    errorMessage?: string
    collapsible?: boolean
    defaultOpen?: boolean
  }>(),
  { loading: false, successMessage: '', errorMessage: '' },
)

const emit = defineEmits<{
  (e: 'update:model-value', value: ProfileSettings): void
  (e: 'submit', form: ProfileSettings): void
}>()

const form = computed(() => props.modelValue)

const aiLoading = ref(false)
const aiError = ref('')

async function reformulateWithAi() {
  aiLoading.value = true
  aiError.value = ''
  try {
    const { text } = await $fetch<{ text: string }>('/api/ai/profile-bio', {
      method: 'POST',
      body: { text: form.value.bio },
      credentials: 'include',
    })
    updateField('bio', text)
  } catch {
    aiError.value = 'KI-Umformulierung fehlgeschlagen. Bitte erneut versuchen.'
  } finally {
    aiLoading.value = false
  }
}

const lastUpdated = computed(() => {
  const date = new Date(form.value.updatedAt)
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
})

function updateField<Key extends keyof ProfileSettings>(key: Key, value: ProfileSettings[Key]) {
  emit('update:model-value', { ...form.value, [key]: value })
}

function onVisibilityChange(e: Event) {
  const value = (e.target as HTMLSelectElement).value as ProfileSettings['visibility']
  updateField('visibility', value)
}

function onSubmit() {
  emit('submit', form.value)
}
</script>
