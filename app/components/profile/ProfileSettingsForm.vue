<template>
  <ProfilePanel title="Persönliche Einstellungen" description="Passe deine öffentlichen Profilinformationen an.">
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
        <label for="profile-bio" class="mb-2 block text-sm font-medium text-gray-700">Über dich</label>
        <textarea
          id="profile-bio"
          rows="4"
          :value="form.bio"
          class="w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
          maxlength="280"
          placeholder="Beschreibe kurz deine Ziele, Motivation oder Highlights."
          @input="updateField('bio', ($event.target as HTMLTextAreaElement).value)"
        />
        <p class="mt-1 text-xs text-gray-400">Maximal 280 Zeichen.</p>
      </div>

      <div class="grid gap-5 sm:grid-cols-2">
        <div class="rounded-2xl border border-black/5 bg-white/70 p-4 shadow-sm">
          <h3 class="text-sm font-semibold text-gray-900">Sichtbarkeit</h3>
          <p class="mt-2 text-sm text-gray-600">Bestimme, wer dein Profil sehen darf.</p>
          <select
              class="mt-3 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
              :value="form.visibility"
              @change="onVisibilityChange"
            >
              <option value="public">Öffentlich</option>
              <option value="protected">Nur Community</option>
              <option value="private">Privat</option>
            </select>
        </div>

        <div class="rounded-2xl border border-black/5 bg-white/70 p-4 shadow-sm">
          <h3 class="text-sm font-semibold text-gray-900">Notification Settings</h3>
          <p class="mt-2 text-sm text-gray-600">Erhalte Updates zu Reaktionen, Erwähnungen und Team-Aktivitäten.</p>
          <label class="mt-3 flex items-center gap-2 text-sm text-gray-700">
            <input
              class="h-4 w-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]/40"
              type="checkbox"
              :checked="form.notifications"
              @change="updateField('notifications', ($event.target as HTMLInputElement).checked)"
            />
            Push & E-Mail aktivieren
          </label>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-xs text-gray-500">Zuletzt aktualisiert {{ lastUpdated }}</p>
        <FormButton type="submit" variant="primary" :loading="loading" label="Änderungen speichern" />
      </div>
    </form>
  </ProfilePanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import InputField from '../molecules/form/InputField.vue'
import ProfilePanel from './ProfilePanel.vue'
import FormButton from '../atoms/form/FormButton.vue'

type ProfileSettings = {
  name: string
  email: string
  bio: string
  visibility: 'public' | 'protected' | 'private'
  notifications: boolean
  updatedAt?: string | Date
}

const props = withDefaults(
  defineProps<{
    modelValue: ProfileSettings
    loading?: boolean
  }>(),
  {
    loading: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: ProfileSettings): void
  (e: 'submit', form: ProfileSettings): void
}>()

const form = computed(() => props.modelValue)

const lastUpdated = computed(() => {
  const date = form.value.updatedAt ? new Date(form.value.updatedAt) : new Date()
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
})

function updateField<Key extends keyof ProfileSettings>(key: Key, value: ProfileSettings[Key]) {
  emit('update:modelValue', { ...form.value, [key]: value })
}

function onVisibilityChange(e: Event) {
  const value = (e.target as HTMLSelectElement).value as ProfileSettings['visibility']
  updateField('visibility', value)
}

function onSubmit() {
  emit('submit', form.value)
}
</script>
