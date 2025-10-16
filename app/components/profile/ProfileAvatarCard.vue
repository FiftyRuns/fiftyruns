<template>
  <ProfilePanel title="Profilbild" description="Gib deinem Profil ein Gesicht – quadratische Bilder funktionieren am besten." padded>
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div class="flex items-center justify-center">
        <div class="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-lg ring-2 ring-[var(--color-primary)]/30">
          <img v-if="preview" :src="preview" alt="Profilbild Vorschau" class="h-full w-full object-cover" />
          <div v-else class="flex h-full w-full items-center justify-center bg-[var(--color-primary)]/10 text-3xl font-semibold text-[var(--color-primary)]">
            {{ initials }}
          </div>
        </div>
      </div>

      <div class="flex-1 space-y-4">
        <p class="text-sm text-gray-600">Lade ein neues Bild hoch oder entferne dein aktuelles Profilbild.</p>
        <div class="flex flex-wrap items-center gap-3">
          <FormButton
            variant="primary"
            label="Neues Bild wählen"
            data-avatar-upload
            @click="triggerUpload"
          />
          <FormButton v-if="preview" variant="secondary" label="Bild entfernen" @click="$emit('remove-picture')" />
        </div>
        <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
      </div>
    </div>

    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
  </ProfilePanel>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import FormButton from '~/components/atoms/form/FormButton.vue'
import ProfilePanel from '~/components/profile/ProfilePanel.vue'
import type { AuthUser } from '~/types/auth'

const props = defineProps<{
  user: AuthUser
  preview?: string | null
  error?: string
}>()

const fileInput = ref<HTMLInputElement | null>(null)

const emit = defineEmits<{
  (e: 'select-picture', file: File | null): void
  (e: 'remove-picture'): void
  (e: 'error', message: string | undefined): void
}>()

const initials = computed(() => props.user.name.slice(0, 2).toUpperCase())

function triggerUpload() {
  fileInput.value?.click()
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null

  if (!file) {
    emit('select-picture', null)
    return
  }

  if (!file.type.startsWith('image/')) {
    emit('error', 'Nur Bilddateien sind erlaubt.')
    input.value = ''
    return
  }

  const MAX_SIZE = 2 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    emit('error', 'Bild darf höchstens 2 MB groß sein.')
    input.value = ''
    return
  }

  emit('error', undefined)
  emit('select-picture', file)
}
</script>
