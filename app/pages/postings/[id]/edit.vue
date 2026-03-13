<template>
  <div class="px-4 py-24">
    <div class="mx-auto w-full max-w-3xl space-y-8">
      <header class="space-y-2">
        <button
          type="button"
          class="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-accent)]"
          @click="goBack"
        >
          <Icon icon="ph:arrow-left-duotone" class="h-5 w-5" />
          Zurück
        </button>
        <h1 class="text-3xl font-semibold text-black">Beitrag bearbeiten</h1>
      </header>

      <div v-if="pending" class="space-y-4">
        <div class="h-6 w-1/3 animate-pulse rounded bg-gray-200"></div>
        <div class="h-32 animate-pulse rounded bg-gray-200"></div>
        <div class="h-10 w-1/2 animate-pulse rounded bg-gray-200"></div>
      </div>

      <div v-else-if="loadError" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ loadError }}
      </div>

      <form v-else class="flex flex-col gap-4" @submit.prevent="handleSubmit">

        <!-- Distanz + Zeit -->
        <div class="flex gap-3">
          <div class="flex-1">
            <label for="post-distance" class="mb-1.5 block text-sm font-medium text-gray-700">
              Distanz (km)
            </label>
            <input
              id="post-distance"
              v-model="form.distanceKm"
              type="text"
              inputmode="decimal"
              class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
              placeholder="z. B. 8,5"
            />
          </div>

          <div class="flex-1">
            <label class="mb-1.5 block text-sm font-medium text-gray-700">Zeit (hh:mm:ss)</label>
            <div class="flex items-center gap-1.5">
              <input ref="hoursRef" type="text" inputmode="numeric" maxlength="2" :value="editHours" placeholder="hh"
                class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
                @input="onTimeInput('h', $event)" />
              <span class="font-medium text-gray-400">:</span>
              <input ref="minutesRef" type="text" inputmode="numeric" maxlength="2" :value="editMinutes" placeholder="mm"
                class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
                @input="onTimeInput('m', $event)" />
              <span class="font-medium text-gray-400">:</span>
              <input ref="secondsRef" type="text" inputmode="numeric" maxlength="2" :value="editSeconds" placeholder="ss"
                class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
                @input="onTimeInput('s', $event)" />
            </div>
          </div>
        </div>

        <!-- Datum & Uhrzeit -->
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700">Datum & Uhrzeit</label>
          <div class="flex items-center gap-1.5">
            <input ref="dayRef" type="text" inputmode="numeric" maxlength="2" :value="editDay" placeholder="TT"
              class="w-12 rounded-xl border border-gray-200 bg-white px-2 py-2.5 text-center text-base text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
              @input="onDatePartInput('day', $event)" />
            <span class="font-medium text-gray-400">.</span>
            <input ref="monthRef" type="text" inputmode="numeric" maxlength="2" :value="editMonth" placeholder="MM"
              class="w-12 rounded-xl border border-gray-200 bg-white px-2 py-2.5 text-center text-base text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
              @input="onDatePartInput('month', $event)" />
            <span class="font-medium text-gray-400">.</span>
            <input ref="yearRef" type="text" inputmode="numeric" maxlength="4" :value="editYear" placeholder="JJJJ"
              class="w-20 rounded-xl border border-gray-200 bg-white px-2 py-2.5 text-center text-base text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
              @input="onDatePartInput('year', $event)" />
            <span class="font-medium text-gray-400 px-1">–</span>
            <input ref="dtHoursRef" type="text" inputmode="numeric" maxlength="2" :value="editDtHours" placeholder="hh"
              class="w-12 rounded-xl border border-gray-200 bg-white px-2 py-2.5 text-center text-base text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
              @input="onDatePartInput('dth', $event)" />
            <span class="font-medium text-gray-400">:</span>
            <input ref="dtMinutesRef" type="text" inputmode="numeric" maxlength="2" :value="editDtMinutes" placeholder="mm"
              class="w-12 rounded-xl border border-gray-200 bg-white px-2 py-2.5 text-center text-base text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
              @input="onDatePartInput('dtm', $event)" />
          </div>
        </div>

        <!-- Beschreibung -->
        <div>
          <div class="mb-1.5 flex items-center justify-between gap-2">
            <label for="post-content" class="text-sm font-medium text-gray-700">
              Beschreibung <span class="font-normal text-gray-400">(optional)</span>
            </label>
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
            id="post-content"
            v-model="form.content"
            rows="3"
            class="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
            placeholder="Ein Satz zum Lauf …"
            maxlength="240"
          ></textarea>
          <div class="mt-1 text-right text-xs text-gray-400">{{ form.content.length }}/240</div>
        </div>

        <!-- Foto -->
        <div class="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-3">
          <label for="post-image-file" class="flex cursor-pointer items-center gap-3">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <Icon icon="ph:camera-duotone" class="h-4 w-4" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-700">
                {{ selectedFileName ? selectedFileName : (currentImageUrl ? 'Foto ändern' : 'Foto hinzufügen') }}
              </p>
              <p class="text-xs text-gray-400">
                {{ selectedFileName ? 'Klicken zum Ändern' : (currentImageUrl ? 'Aktuelles Bild · Klicken zum Ändern' : 'optional · JPG, PNG, WebP') }}
              </p>
            </div>
            <input
              id="post-image-file"
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="sr-only"
              @change="onFileSelected"
            />
          </label>

          <div v-if="currentImageUrl" class="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <img :src="currentImageUrl" alt="Beitragsbild" class="h-48 w-full object-cover" />
            <div class="flex justify-end px-3 py-2">
              <button
                type="button"
                class="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                @click="clearImage"
              >
                <Icon icon="ph:trash-duotone" class="h-4 w-4" />
                Bild entfernen
              </button>
            </div>
          </div>
        </div>

        <!-- Sichtbarkeit + Aktionen -->
        <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-gray-500">Sichtbarkeit</label>
            <select
              id="post-visibility"
              v-model="form.visibility"
              class="h-[38px] rounded-xl border border-gray-200 bg-white px-3 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
            >
              <option value="public">Öffentlich</option>
              <option value="protected">Community</option>
              <option value="private">Nur ich</option>
            </select>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              @click="goBack"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              class="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-primary)]/90 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="saving"
            >
              <Icon icon="ph:floppy-disk-duotone" class="h-4 w-4" />
              Speichern
            </button>
          </div>
        </div>

        <p v-if="saveError" class="text-xs text-red-600">{{ saveError }}</p>
        <p v-else-if="saveSuccess" class="text-xs text-green-600">{{ saveSuccess }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { useCookie, useAsyncData } from 'nuxt/app'
import { useRoute, useRouter } from 'vue-router'
import { upload } from '@vercel/blob/client'

type EditPostResponse = {
  id: string
  createdAt: string
  text: string
  visibility: 'public' | 'protected' | 'private'
  image: string | null
  distanceInMeters: number | null
  durationInSeconds: number | null
}

const route = useRoute()
const router = useRouter()
const csrfCookie = useCookie<string | null>('csrf_token', { default: () => null })
const postId = String(route.params.id || '')

const form = reactive({
  content: '',
  visibility: 'protected' as 'public' | 'protected' | 'private',
  image: '',
  distanceKm: '',
})

const editHours = ref('')
const editMinutes = ref('')
const editSeconds = ref('')
const hoursRef = ref<HTMLInputElement | null>(null)
const minutesRef = ref<HTMLInputElement | null>(null)
const secondsRef = ref<HTMLInputElement | null>(null)

const editDay = ref('')
const editMonth = ref('')
const editYear = ref('')
const editDtHours = ref('')
const editDtMinutes = ref('')
const dayRef = ref<HTMLInputElement | null>(null)
const monthRef = ref<HTMLInputElement | null>(null)
const yearRef = ref<HTMLInputElement | null>(null)
const dtHoursRef = ref<HTMLInputElement | null>(null)
const dtMinutesRef = ref<HTMLInputElement | null>(null)

const saving = ref(false)
const aiLoading = ref(false)
const saveError = ref('')
const saveSuccess = ref('')
const selectedFile = ref<File | null>(null)
const filePreviewUrl = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const { data, pending, error, refresh } = await useAsyncData(
  `post-edit-${postId}`,
  () =>
    $fetch<EditPostResponse>(`/api/profile/posts/${postId}`, {
      credentials: 'include',
    }),
  { server: true },
)

watch(
  data,
  (value) => {
    if (!value) return
    form.content = value.text
    form.visibility = value.visibility
    form.image = value.image ?? ''
    form.distanceKm = formatDistanceInput(value.distanceInMeters)
    const { h, m, s } = parseDurationToHoursMinutes(value.durationInSeconds)
    editHours.value = h
    editMinutes.value = m
    editSeconds.value = s
    const d = value.createdAt ? new Date(value.createdAt) : new Date()
    editDay.value = String(d.getDate()).padStart(2, '0')
    editMonth.value = String(d.getMonth() + 1).padStart(2, '0')
    editYear.value = String(d.getFullYear())
    editDtHours.value = String(d.getHours()).padStart(2, '0')
    editDtMinutes.value = String(d.getMinutes()).padStart(2, '0')
    resetFileSelection()
  },
  { immediate: true },
)

const loadError = computed(() => (error.value ? 'Beitrag konnte nicht geladen werden.' : ''))
const currentImageUrl = computed(() => {
  if (filePreviewUrl.value) return filePreviewUrl.value
  const trimmed = form.image.trim()
  return trimmed.length ? trimmed : ''
})
const selectedFileName = computed(() => selectedFile.value?.name ?? '')

function clearImage() {
  form.image = ''
  resetFileSelection()
}

function resetFileSelection() {
  if (filePreviewUrl.value) {
    URL.revokeObjectURL(filePreviewUrl.value)
    filePreviewUrl.value = null
  }
  selectedFile.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function formatDistanceInput(meters: number | null) {
  if (meters === null || meters === undefined) return ''
  return (meters / 1000).toFixed(2).replace(/\.?0+$/, '')
}

function parseDurationToHoursMinutes(seconds: number | null): { h: string; m: string; s: string } {
  if (seconds === null || seconds === undefined) return { h: '', m: '', s: '' }
  const total = Math.max(0, Math.floor(seconds))
  return {
    h: String(Math.floor(total / 3600)),
    m: String(Math.floor((total % 3600) / 60)),
    s: String(total % 60),
  }
}

function parseDistanceToMeters(input: string): number | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const normalized = Number(trimmed.replace(',', '.'))
  if (!Number.isFinite(normalized) || normalized < 0) {
    throw new Error('Distanz ist ungültig.')
  }
  return Math.round(normalized * 1000)
}

function parseDurationInputToSeconds(): number | null {
  const h = editHours.value.trim()
  const m = editMinutes.value.trim()
  const s = editSeconds.value.trim()
  if (!h && !m && !s) return null
  const hNum = Number(h || '0')
  const mNum = Number(m || '0')
  const sNum = Number(s || '0')
  if (!Number.isInteger(hNum) || !Number.isInteger(mNum) || !Number.isInteger(sNum) || hNum < 0 || hNum > 23 || mNum < 0 || mNum > 59 || sNum < 0 || sNum > 59) {
    throw new Error('Stunden (0–23), Minuten (0–59) und Sekunden (0–59) eingeben.')
  }
  return hNum * 3600 + mNum * 60 + sNum
}

function onTimeInput(field: 'h' | 'm' | 's', event: Event) {
  const input = event.target as HTMLInputElement
  const raw = input.value.replace(/\D/g, '').slice(0, 2)
  input.value = raw
  if (field === 'h') { editHours.value = raw; if (raw.length === 2) minutesRef.value?.focus() }
  else if (field === 'm') { editMinutes.value = raw; if (raw.length === 2) secondsRef.value?.focus() }
  else { editSeconds.value = raw }
}

function onDatePartInput(field: 'day' | 'month' | 'year' | 'dth' | 'dtm', event: Event) {
  const input = event.target as HTMLInputElement
  const maxLen = field === 'year' ? 4 : 2
  const raw = input.value.replace(/\D/g, '').slice(0, maxLen)
  input.value = raw
  if (field === 'day') { editDay.value = raw; if (raw.length === 2) monthRef.value?.focus() }
  else if (field === 'month') { editMonth.value = raw; if (raw.length === 2) yearRef.value?.focus() }
  else if (field === 'year') { editYear.value = raw; if (raw.length === 4) dtHoursRef.value?.focus() }
  else if (field === 'dth') { editDtHours.value = raw; if (raw.length === 2) dtMinutesRef.value?.focus() }
  else { editDtMinutes.value = raw }
}

function buildCreatedAtIso(): string | undefined {
  const d = editDay.value.padStart(2, '0')
  const mo = editMonth.value.padStart(2, '0')
  const y = editYear.value
  const h = editDtHours.value.padStart(2, '0')
  const mi = editDtMinutes.value.padStart(2, '0')
  if (y.length !== 4) return undefined
  const date = new Date(`${y}-${mo}-${d}T${h}:${mi}:00`)
  return isNaN(date.getTime()) ? undefined : date.toISOString()
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  resetFileSelection()
  if (file) {
    selectedFile.value = file
    filePreviewUrl.value = URL.createObjectURL(file)
    form.image = ''
  }
}

async function reformulateWithAi() {
  aiLoading.value = true
  try {
    const h = editHours.value || '0'
    const m = editMinutes.value || '0'
    const s = editSeconds.value || '0'
    const duration = `${h.padStart(2, '0')}:${m.padStart(2, '0')}:${s.padStart(2, '0')}`
    const { text } = await $fetch<{ text: string }>('/api/ai/reformulate', {
      method: 'POST',
      body: {
        text: form.content || '',
        distanceKm: form.distanceKm || '',
        duration,
      },
      credentials: 'include',
    })
    form.content = text
  } catch {
    // ignore silently
  } finally {
    aiLoading.value = false
  }
}

async function handleSubmit() {
  saveError.value = ''
  saveSuccess.value = ''

  const csrf = csrfCookie.value || ''
  if (!csrf) {
    saveError.value = 'Sicherheits-Token fehlt.'
    return
  }

  let distanceInMeters: number | null = null
  let durationInSeconds: number | null = null

  try {
    distanceInMeters = parseDistanceToMeters(form.distanceKm)
    durationInSeconds = parseDurationInputToSeconds()
  } catch (err: any) {
    saveError.value = err?.message || 'Eingaben für Distanz oder Zeit sind ungültig.'
    return
  }

  if ((distanceInMeters === null) !== (durationInSeconds === null)) {
    saveError.value = 'Distanz und Zeit müssen gemeinsam gesetzt oder entfernt werden.'
    return
  }

  saving.value = true

  try {
    let imagePayload = form.image.trim()

    if (selectedFile.value) {
      const response = await upload(selectedFile.value.name, selectedFile.value, {
        access: 'public',
        handleUploadUrl: '/api/blob.upload',
        multipart: true,
      })
      imagePayload = response.url
    }

    await $fetch(`/api/profile/posts/${postId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'x-csrf-token': csrf },
      body: {
        content: form.content,
        visibility: form.visibility,
        image: imagePayload.length ? imagePayload : null,
        distanceInMeters,
        durationInSeconds,
        createdAt: buildCreatedAtIso(),
      },
    })

    form.image = imagePayload
    resetFileSelection()
    await refresh()
    saveSuccess.value = 'Beitrag aktualisiert.'
  } catch (err: any) {
    const message = err?.data?.message || err?.message || 'Aktualisierung fehlgeschlagen.'
    saveError.value = message
  } finally {
    saving.value = false
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push(`/postings/${postId}`)
  }
}

onBeforeUnmount(() => {
  resetFileSelection()
})
</script>
