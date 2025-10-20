<template>
  <ProfilePanel
    title="Profilbild"
    description="Gib deinem Profil ein Gesicht – quadratische Bilder funktionieren am besten."
    padded
  >
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div class="flex items-center justify-center">
        <div class="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-lg ring-2 ring-[var(--color-primary)]/30">
          <img v-if="preview" :src="preview" alt="Profilbild Vorschau" class="h-full w-full object-cover" />
          <div v-else class="flex h-full w-full items-center justify-center bg-[var(--color-primary)]/10 text-3xl font-semibold text-[var(--color-primary)]">
            {{ initials }}
          </div>

          <!-- Overlay bei Aktionen -->
          <div v-if="uploading || saving" class="absolute inset-0 grid place-items-center bg-black/40 text-white text-xs">
            <span>{{ uploading ? 'Lädt …' : 'Speichert …' }}</span>
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
            :disabled="uploading || saving"
            @click="triggerUpload"
          />
          <FormButton
            variant="primary"
            label="Speichern"
            :disabled="!pendingFile || uploading || saving"
            @click="saveAvatar"
          />
          <FormButton
            v-if="currentUrl || preview"
            variant="secondary"
            label="Bild entfernen"
            :disabled="uploading || saving"
            @click="removeAvatar"
          />
        </div>

        <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
        <p v-if="success" class="text-xs text-green-600">{{ success }}</p>
      </div>
    </div>

    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
  </ProfilePanel>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { upload } from '@vercel/blob/client'
import { useCookie } from 'nuxt/app'
import FormButton from '../atoms/form/FormButton.vue'
import ProfilePanel from './ProfilePanel.vue'
import type { AuthUser } from '../../types/auth'

const props = withDefaults(defineProps<{
  user: AuthUser
  preview?: string | null
  error?: string
  handleUploadUrl?: string
  deleteUrl?: string       
}>(), {
  preview: null,
  error: '',
  handleUploadUrl: '/api/blob.upload',
  deleteUrl: '/api/blob.delete',
})

const emit = defineEmits<{
  (e: 'error', message?: string): void
  (e: 'select-picture', file: File | null): void
  (e: 'remove-picture'): void
  (e: 'saved', url: string | null): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const pendingFile = ref<File | null>(null)
const preview = ref<string | null>(props.preview ?? props.user.image ?? null)
const currentUrl = ref<string | null>(props.preview ?? props.user.image ?? null) // gespeichertes Bild
const uploading = ref(false)
const saving = ref(false)
const error = ref('')
const success = ref('')
const csrfToken = useCookie<string | null>('csrf_token')

const initials = computed(() => props.user.name.slice(0, 2).toUpperCase())

function triggerUpload() {
  fileInput.value?.click()
}

watch(
  () => props.preview,
  (val) => {
    if (pendingFile.value) return
    const next = val ?? props.user.image ?? null
    preview.value = next
    currentUrl.value = next
  }
)

watch(
  () => props.user.image,
  (val) => {
    if (pendingFile.value) return
    const next = props.preview ?? val ?? null
    preview.value = next
    currentUrl.value = next
  }
)

function setError(msg?: string) {
  error.value = msg || ''
  success.value = ''
  emit('error', msg)
}

function setSuccess(msg: string) {
  success.value = msg
  error.value = ''
}

function toDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0] ?? null

  if (!file) {
    pendingFile.value = null
    if (fileInput.value) fileInput.value.value = ''
    emit('select-picture', null)
    return
  }

  if (!file.type.startsWith('image/')) {
    setError('Nur Bilddateien sind erlaubt.')
    input.value = ''
    emit('select-picture', null)
    return
  }
  const MAX = 2 * 1024 * 1024
  if (file.size > MAX) {
    setError('Bild darf höchstens 2 MB groß sein.')
    input.value = ''
    emit('select-picture', null)
    return
  }

  pendingFile.value = file
  preview.value = await toDataUrl(file)
  setError()
  emit('select-picture', file)
}

async function saveAvatar() {
  if (!pendingFile.value) return
  try {
    uploading.value = true
    const res = await upload(pendingFile.value.name, pendingFile.value, {
      access: 'public',                
      handleUploadUrl: props.handleUploadUrl,
      multipart: true,
      ...(csrfToken.value ? { headers: { 'x-csrf-token': csrfToken.value } } : {}),
    })
    uploading.value = false

    currentUrl.value = res.url
    preview.value = res.url
    pendingFile.value = null
    if (fileInput.value) fileInput.value.value = ''
    emit('saved', res.url)
    setSuccess('Profilbild gespeichert.')
    emit('select-picture', null)
  } catch (e: any) {
    uploading.value = false
    setError(e?.data?.message || e?.message || 'Upload fehlgeschlagen.')
  }
}

async function removeAvatar() {
  try {
    if (!currentUrl.value) {
      preview.value = null
      pendingFile.value = null
      if (fileInput.value) fileInput.value.value = ''
      emit('saved', null)
      emit('remove-picture')
      emit('select-picture', null)
      return
    }

    saving.value = true
    const csrf = useCookie('csrf_token').value || ''
    await $fetch(props.deleteUrl, {
      method: 'POST',
      headers: { 'x-csrf-token': csrf },
      body: { url: currentUrl.value },
      credentials: 'include',
    })
    saving.value = false

    currentUrl.value = null
    preview.value = null
    pendingFile.value = null
    if (fileInput.value) fileInput.value.value = ''
    emit('saved', null)
    setSuccess('Profilbild entfernt.')
    emit('remove-picture')
    emit('select-picture', null)
  } catch (e: any) {
    saving.value = false
    setError(e?.data?.message || e?.message || 'Entfernen fehlgeschlagen.')
  }
}
</script>
