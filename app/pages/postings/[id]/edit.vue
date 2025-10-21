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
        <h1 class="text-3xl font-bold text-gray-900">Beitrag bearbeiten</h1>
      </header>

      <div v-if="pending" class="space-y-4">
        <div class="h-6 w-1/3 animate-pulse rounded bg-gray-200"></div>
        <div class="h-32 animate-pulse rounded bg-gray-200"></div>
        <div class="h-10 w-1/2 animate-pulse rounded bg-gray-200"></div>
      </div>

      <div v-else-if="loadError" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ loadError }}
      </div>

      <form v-else class="space-y-6" @submit.prevent="handleSubmit">
        <div>
          <label for="post-content" class="mt-2 mb-2 block text-sm font-semibold text-gray-800">Inhalt</label>
          <textarea
            id="post-content"
            v-model="form.content"
            rows="6"
            class="w-full resize-y rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
            placeholder="Teile deine Laufmomente..."
            required
          ></textarea>
        </div>

        <div class="grid gap-6 sm:grid-cols-2">
          <div>
            <label for="post-visibility" class="mb-2 block text-sm font-semibold text-gray-800">Sichtbarkeit</label>
            <select
              id="post-visibility"
              v-model="form.visibility"
              class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
            >
              <option value="public">Öffentlich</option>
              <option value="protected">Community</option>
              <option value="private">Privat</option>
            </select>
          </div>

          <div>
            <label for="post-image" class="mb-2 block text-sm font-semibold text-gray-800">Bild-URL</label>
            <input
              id="post-image"
              v-model="form.image"
              type="url"
              class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
              placeholder="https://..."
            />
            <p class="mt-1 text-xs text-gray-500">Leerlassen, um das Bild zu entfernen.</p>
          </div>
        </div>

        <div class="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-gray-800">Beitragsbild</p>
              <p class="text-xs text-gray-500">Direkte URL verwenden oder Datei hochladen.</p>
            </div>
            <div class="flex items-center gap-2">
              <span v-if="selectedFileName" class="max-w-[160px] truncate text-xs text-gray-500" :title="selectedFileName">
                {{ selectedFileName }}
              </span>
              <label
                for="post-image-file"
                class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
              >
                <Icon icon="ph:cloud-arrow-up-duotone" class="h-4 w-4" />
                Datei wählen
              </label>
              <input
                id="post-image-file"
                ref="fileInputRef"
                type="file"
                accept="image/*"
                class="sr-only"
                @change="onFileSelected"
              />
            </div>
          </div>

          <div v-if="currentImageUrl" class="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <img :src="currentImageUrl" alt="Aktuelles Beitragsbild" class="h-48 w-full object-cover" />
            <div class="flex items-center justify-between gap-3 px-3 py-2 text-xs text-gray-500">
              <span class="truncate" :title="currentImageUrl">{{ currentImageUrl }}</span>
              <button
                type="button"
                class="inline-flex items-center gap-1 text-[var(--color-primary)] hover:text-red-600"
                @click="clearImage"
              >
                <Icon icon="ph:trash-duotone" class="h-4 w-4" />
                Entfernen
              </button>
            </div>
          </div>
          <p v-else class="mt-3 text-xs text-gray-500">Noch kein Bild ausgewählt.</p>
        </div>

        <div class="grid gap-6 sm:grid-cols-2">
          <div>
            <label for="post-distance" class="mb-2 block text-sm font-semibold text-gray-800">
              Distanz (km)
            </label>
            <input
              id="post-distance"
              v-model="form.distanceKm"
              type="text"
              inputmode="decimal"
              class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
              placeholder="z. B. 5.2"
            />
            <p class="mt-1 text-xs text-gray-500">Leer lassen, um die Distanz zu entfernen.</p>
          </div>

          <div>
            <label for="post-duration" class="mb-2 block text-sm font-semibold text-gray-800">
              Dauer (hh:mm:ss oder mm:ss)
            </label>
            <input
              id="post-duration"
              v-model="form.duration"
              type="text"
              inputmode="numeric"
              class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
              placeholder="z. B. 00:27:45"
            />
            <p class="mt-1 text-xs text-gray-500">Leer lassen, um die Dauer zu entfernen.</p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            class="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white shadow hover:bg-[var(--color-primary)]/90 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="saving"
          >
            <Icon icon="ph:floppy-disk-duotone" class="h-5 w-5" />
            Speichern
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-2xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            @click="goBack"
          >
            Abbrechen
          </button>
          <span v-if="saveError" class="text-sm text-red-600">{{ saveError }}</span>
          <span v-else-if="saveSuccess" class="text-sm text-green-600">{{ saveSuccess }}</span>
        </div>
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
  duration: '',
})

const saving = ref(false)
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
  {
    server: true,
  },
)

watch(
  data,
  (value) => {
    if (!value) return
    form.content = value.text
    form.visibility = value.visibility
    form.image = value.image ?? ''
    form.distanceKm = formatDistanceInput(value.distanceInMeters)
    form.duration = formatDurationInput(value.durationInSeconds)
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

watch(
  () => form.image,
  (value) => {
    if (!value.trim()) return
    if (!selectedFile.value && !filePreviewUrl.value) return
    resetFileSelection()
  },
)

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

function pad(input: number) {
  return String(input).padStart(2, '0')
}

function formatDistanceInput(meters: number | null) {
  if (meters === null || meters === undefined) return ''
  const km = meters / 1000
  const fixed = km.toFixed(2)
  return fixed.replace(/\.?0+$/, '')
}

function formatDurationInput(seconds: number | null) {
  if (seconds === null || seconds === undefined) return ''
  const total = Math.max(0, Math.floor(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
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

function parseDurationToSeconds(input: string): number | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const m3 = /^(\d{1,2}):([0-5]?\d):([0-5]?\d)$/.exec(trimmed)
  if (m3) {
    const h = Number(m3[1])
    const m = Number(m3[2])
    const s = Number(m3[3])
    if (!Number.isInteger(h) || !Number.isInteger(m) || !Number.isInteger(s)) {
      throw new Error('Dauer darf nur ganze Zahlen ≥ 0 enthalten.')
    }
    return h * 3600 + m * 60 + s
  }

  const m2 = /^([0-5]?\d):([0-5]?\d)$/.exec(trimmed)
  if (m2) {
    const m = Number(m2[1])
    const s = Number(m2[2])
    if (!Number.isInteger(m) || !Number.isInteger(s)) {
      throw new Error('Dauer darf nur ganze Zahlen ≥ 0 enthalten.')
    }
    return m * 60 + s
  }

  throw new Error('Dauer muss im Format hh:mm:ss oder mm:ss angegeben werden.')
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

async function handleSubmit() {
  saveError.value = ''
  saveSuccess.value = ''

  if (!form.content.trim()) {
    saveError.value = 'Inhalt darf nicht leer sein.'
    return
  }

  const csrf = csrfCookie.value || ''
  if (!csrf) {
    saveError.value = 'Sicherheits-Token fehlt.'
    return
  }

  let distanceInMeters: number | null = null
  let durationInSeconds: number | null = null

  try {
    distanceInMeters = parseDistanceToMeters(form.distanceKm)
    durationInSeconds = parseDurationToSeconds(form.duration)
  } catch (err: any) {
    saveError.value = err?.message || 'Eingaben für Distanz oder Dauer sind ungültig.'
    return
  }

  if ((distanceInMeters === null) !== (durationInSeconds === null)) {
    saveError.value = 'Distanz und Dauer müssen gemeinsam gesetzt oder entfernt werden.'
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
  router.back()
}

onBeforeUnmount(() => {
  resetFileSelection()
})
</script>
