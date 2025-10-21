<template>
  <ProfilePanel
    title="Neuen Lauf posten"
    description="Foto, Kilometer, Zeit – fertig."
    :bleed="true"
  >
    <form class="space-y-5" @submit.prevent="onSubmit">
      <!-- Foto-Upload -->
      <div class="rounded-2xl border border-dashed border-[var(--color-primary)]/40 bg-white/60 p-4">
        <label for="post-photo" class="block cursor-pointer">
          <div class="flex items-center justify-between gap-3">
            <div class="text-sm">
              <p class="font-medium text-[var(--color-primary)]">Foto hinzufügen</p>
              <p class="text-gray-500">Ein Bild auswählen (optional)</p>
            </div>
            <span
              class="rounded-xl bg-[var(--color-primary)]/10 px-3 py-1 text-xs text-[var(--color-primary)]"
              v-if="photoName"
            >{{ photoName }}</span>
          </div>
          <input
            id="post-photo"
            type="file"
            accept="image/*"
            class="sr-only"
            @change="onPhotoSelected"
          />
        </label>

        <div v-if="photoPreviewUrl" class="mt-3 overflow-hidden rounded-xl border border-[var(--color-primary)]/40">
          <img :src="photoPreviewUrl" alt="Ausgewähltes Foto" class="h-56 w-full object-cover" />
        </div>
      </div>

      <!-- Distanz -->
      <div>
        <label for="post-distance" class="mb-2 block text-sm font-medium text-gray-700">
          Distanz (km)
        </label>
        <input
          id="post-distance"
          type="number"
          inputmode="decimal"
          min="0"
          step="0.1"
          :value="form.distanceKm"
          class="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-base text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
          placeholder="z. B. 8.5"
          @input="updateField('distanceKm', ($event.target as HTMLInputElement).value)"
        />
        <p v-if="distanceError" class="mt-1 text-xs text-red-600">
          Bitte eine gültige Zahl ≥ 0 eingeben.
        </p>
      </div>

      <!-- Zeit (vereinfacht: Stunden / Minuten) -->
      <div>
        <label class="mb-2 block text-sm font-medium text-gray-700">
          Zeit
        </label>
        <div class="flex items-center gap-2">
          <input
            id="post-hours"
            type="number"
            min="0"
            max="23"
            :value="hours"
            class="w-20 rounded-xl border border-gray-200 bg-white px-3 py-3 text-base text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
            placeholder="hh"
            @input="updateHours(($event.target as HTMLInputElement).value)"
          />
          <span class="text-gray-500">:</span>
          <input
            id="post-minutes"
            type="number"
            min="0"
            max="59"
            :value="minutes"
            class="w-20 rounded-xl border border-gray-200 bg-white px-3 py-3 text-base text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
            placeholder="mm"
            @input="updateMinutes(($event.target as HTMLInputElement).value)"
          />
        </div>
        <p v-if="timeError" class="mt-1 text-xs text-red-600">
          Bitte Stunden und Minuten korrekt eingeben.
        </p>
      </div>

      <!-- Kurzer Text -->
      <div>
        <label for="post-content" class="mb-2 block text-sm font-medium text-gray-700">
          Kurzer Text (optional)
        </label>
        <textarea
          id="post-content"
          rows="3"
          :value="form.content"
          class="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
          placeholder="Ein Satz zum Lauf …"
          maxlength="240"
          @input="updateField('content', ($event.target as HTMLTextAreaElement).value)"
        />
        <div class="mt-1 text-right text-xs text-gray-400">
          <span>{{ form.content.length }}/240</span>
        </div>
      </div>

      <!-- Previewchips -->
      <div class="flex flex-wrap gap-2 text-xs text-gray-600">
        <span
          v-if="normalizedDistanceMeters !== null"
          class="inline-flex items-center gap-1 rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-2 py-1 text-[var(--color-primary)]"
        >
          ~ {{ (normalizedDistanceMeters / 1000).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }} km
        </span>
        <span
          v-if="normalizedDurationSeconds !== null"
          class="inline-flex items-center gap-1 rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-accent)]/10 px-2 py-1 text-[var(--color-primary)]"
        >
          {{ formatSeconds(normalizedDurationSeconds) }}
        </span>
      </div>

      <!-- Aktionen -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <select
          class="h-[40px] rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
          :value="form.visibility"
          @change="updateField('visibility', ($event.target as HTMLSelectElement).value as Visibility)"
        >
          <option value="public">Öffentlich</option>
          <option value="protected">Community</option>
          <option value="private">Nur ich</option>
        </select>

        <FormButton
          type="submit"
          variant="primary"
          :loading="loading"
          :disabled="!canSubmit"
          label="Teilen"
        />
      </div>

      <p v-if="successMessage" class="text-xs text-green-600">{{ successMessage }}</p>
      <p v-else-if="errorMessage" class="text-xs text-red-600">{{ errorMessage }}</p>
    </form>
  </ProfilePanel>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ProfilePanel from './ProfilePanel.vue'
import FormButton from '../atoms/form/FormButton.vue'
import { upload } from '@vercel/blob/client'

type Visibility = 'public' | 'protected' | 'private'

export type PostComposerForm = {
  title: string
  content: string
  visibility: Visibility
  distanceKm: string
  duration: string
  garminActivityId?: string
  createdAt?: string
}

export type PostComposerSubmitPayload =
  PostComposerForm & {
    distanceInMeters: number | null
    durationInSeconds: number | null
    photoFile?: File | null
    imageUrl?: string | null
  }

const props = withDefaults(
  defineProps<{
    modelValue: PostComposerForm
    loading?: boolean
    errorMessage?: string
    successMessage?: string
  }>(),
  { loading: false, errorMessage: '', successMessage: '' },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: PostComposerForm): void
  (e: 'submit', value: PostComposerSubmitPayload): void
}>()

const form = computed(() => props.modelValue)

/** Foto-Upload **/
const imageUrl = ref<string|null>(null)
const photoFile = ref<File | null>(null)
const photoPreviewUrl = ref<string | null>(null)
const photoName = computed(() => photoFile.value?.name ?? '')

function onPhotoSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  photoFile.value = file ?? null

  if (photoPreviewUrl.value) URL.revokeObjectURL(photoPreviewUrl.value)
  photoPreviewUrl.value = file ? URL.createObjectURL(file) : null
}

/** Distanz **/
function updateField<Key extends keyof PostComposerForm>(key: Key, value: PostComposerForm[Key]) {
  emit('update:modelValue', { ...form.value, [key]: value })
}

const distanceError = computed(() => {
  const v = form.value.distanceKm?.trim()
  if (!v) return true // Pflichtfeld → leer ist Fehler
  const num = Number(v.replace(',', '.'))
  return !Number.isFinite(num) || num < 0
})

/** Zeit **/
const hours = ref('')
const minutes = ref('')

function updateHours(v: string) {
  hours.value = v
  updateField('duration', `${(v || '0').padStart(2, '0')}:${(minutes.value || '0').padStart(2, '0')}`)
}

function updateMinutes(v: string) {
  minutes.value = v
  updateField('duration', `${(hours.value || '0').padStart(2, '0')}:${(v || '0').padStart(2, '0')}`)
}

const timeError = computed(() => {
  // Pflichtfelder → beide müssen gesetzt und gültig sein
  if (hours.value === '' || minutes.value === '') return true
  const h = Number(hours.value)
  const m = Number(minutes.value)
  return (
    !Number.isFinite(h) ||
    !Number.isFinite(m) ||
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59
  )
})

/** Normalisierte Werte **/
const normalizedDistanceMeters = computed<number | null>(() => {
  const v = form.value.distanceKm?.trim()
  if (!v) return null
  const num = Number(v.replace(',', '.'))
  if (!Number.isFinite(num) || num < 0) return null
  return Math.round(num * 1000)
})

const normalizedDurationSeconds = computed<number | null>(() => {
  if (timeError.value) return null
  const h = Number(hours.value)
  const m = Number(minutes.value)
  return h * 3600 + m * 60
})

/** Validierung & Submit **/
const canSubmit = computed(() =>
  !distanceError.value &&
  !timeError.value
)

function formatSeconds(total: number) {
  const s = Math.max(0, Math.floor(total))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}


async function onSubmit() {
  // 1) validieren wie gehabt
  if (!canSubmit.value) return

  // 2) falls Foto vorhanden: direkt zu Vercel Blob hochladen
  if (photoFile.value) {
    const res = await upload(photoFile.value.name, photoFile.value, {
      access: 'public',
      handleUploadUrl: '/api/blob.upload',
      multipart: true,
    })
    imageUrl.value = res.url
  } else {
    imageUrl.value = null
  }

  // 3) an Parent emittieren – jetzt inkl. imageUrl
  emit('submit', {
    ...form.value,
    distanceInMeters: normalizedDistanceMeters.value,
    durationInSeconds: normalizedDurationSeconds.value,
    photoFile: null,              
    imageUrl: imageUrl.value,     
  })
}
</script>
