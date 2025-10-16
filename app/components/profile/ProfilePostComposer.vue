<template>
  <ProfilePanel
    title="Neuen Beitrag erstellen"
    description="Teile deine neuesten Runs mit der Community."
    :bleed="true"
  >
    <form class="space-y-5" @submit.prevent="onSubmit">
      <div class="grid gap-4 md:grid-cols-[1fr,auto]">
        <InputField
          id="post-title"
          :model-value="form.title"
          label="Titel (optional)"
          maxlength="80"
          @update:model-value="updateField('title', $event)"
        />
        <select
          class="mt-6 h-[42px] rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
          :value="form.visibility"
          @change="updateField('visibility', ($event.target as HTMLSelectElement).value as Visibility)"
        >
          <option value="public">Öffentlich</option>
          <option value="protected">Community</option>
          <option value="private">Nur ich</option>
        </select>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <!-- Kilometer -->
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
            class="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
            placeholder="z. B. 8.5"
            @input="updateField('distanceKm', ($event.target as HTMLInputElement).value)"
          />
          <p v-if="distanceError" class="mt-1 text-xs text-red-600">
            Bitte eine gültige Zahl ≥ 0 eingeben.
          </p>
        </div>

        <!-- Zeit -->
        <div>
          <label for="post-duration" class="mb-2 block text-sm font-medium text-gray-700">
            Zeit (hh:mm oder hh:mm:ss)
          </label>
          <input
            id="post-duration"
            type="text"
            :value="form.duration"
            class="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
            placeholder="z. B. 00:45:30"
            @input="updateField('duration', ($event.target as HTMLInputElement).value)"
          />
          <p v-if="timeError" class="mt-1 text-xs text-red-600">
            Bitte im Format hh:mm oder hh:mm:ss eingeben.
          </p>
        </div>
      </div>

      <div>
        <label for="post-content" class="mb-2 block text-sm font-medium text-gray-700">Inhalt</label>
        <textarea
          id="post-content"
          rows="4"
          :value="form.content"
          class="w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
          placeholder="Wie verlief dein letzter Lauf? Hast du Tipps oder Eindrücke, die du teilen möchtest?"
          maxlength="1200"
          @input="updateField('content', ($event.target as HTMLTextAreaElement).value)"
        />
        <div class="mt-1 flex items-center justify-between text-xs text-gray-400">
          <span>{{ form.content.length }}/1200 Zeichen</span>
          <button
            type="button"
            class="text-[var(--color-accent)] underline-offset-2 hover:underline"
            @click="$emit('open-media-library')"
          >
            Medien hinzufügen
          </button>
        </div>
      </div>

      <!-- kleine Preview-Chips -->
      <div class="flex flex-wrap gap-2 text-xs text-gray-600">
        <span
          v-if="normalizedDistanceMeters !== null"
          class="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white/80 px-2 py-1"
        >
          ~ {{ (normalizedDistanceMeters / 1000).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }} km
        </span>
        <span
          v-if="normalizedDurationSeconds !== null"
          class="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white/80 px-2 py-1"
        >
          {{ formatSeconds(normalizedDurationSeconds) }}
        </span>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <p v-if="successMessage" class="text-xs text-green-600">{{ successMessage }}</p>
        <p v-else-if="errorMessage" class="text-xs text-red-600">{{ errorMessage }}</p>
        <div class="flex items-center gap-2">
          <FormButton type="button" variant="secondary" label="Entwurf speichern" @click="$emit('save-draft', form)" />
          <FormButton
            type="submit"
            variant="primary"
            :loading="loading"
            :disabled="!canSubmit"
            label="Beitrag teilen"
          />
        </div>
      </div>
    </form>
  </ProfilePanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import InputField from '../molecules/form/InputField.vue'
import ProfilePanel from '../profile/ProfilePanel.vue'
import FormButton from '../atoms/form/FormButton.vue'

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
  (e: 'save-draft', value: PostComposerForm): void
  (e: 'open-media-library'): void
}>()

const form = computed(() => props.modelValue)

/** Helpers */
function updateField<Key extends keyof PostComposerForm>(key: Key, value: PostComposerForm[Key]) {
  emit('update:modelValue', { ...form.value, [key]: value })
}

const distanceError = computed(() => {
  const v = form.value.distanceKm?.trim()
  if (!v) return false
  const num = Number(v.replace(',', '.'))
  return !Number.isFinite(num) || num < 0
})

const timeError = computed(() => {
  const v = form.value.duration?.trim()
  if (!v) return false
  return !/^\d{1,2}:[0-5]\d(?::[0-5]\d)?$/.test(v)
})

const normalizedDistanceMeters = computed<number | null>(() => {
  const v = form.value.distanceKm?.trim()
  if (!v) return null
  const num = Number(v.replace(',', '.'))
  if (!Number.isFinite(num) || num < 0) return null
  return Math.round(num * 1000)
})

const normalizedDurationSeconds = computed<number | null>(() => {
  const v = form.value.duration?.trim()
  if (!v) return null
  const m = v.match(/^(\d{1,2}):([0-5]\d)(?::([0-5]\d))?$/)
  if (!m) return null
  const h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  const s = m[3] ? parseInt(m[3], 10) : 0
  return h * 3600 + min * 60 + s
})

const canSubmit = computed(() => !distanceError.value && !timeError.value && form.value.content.trim().length > 0)

function formatSeconds(total: number) {
  const s = Math.max(0, Math.floor(total))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function onSubmit() {
  emit('submit', {
    ...form.value,
    distanceInMeters: normalizedDistanceMeters.value,
    durationInSeconds: normalizedDurationSeconds.value,
  })
}
</script>
