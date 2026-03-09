<template>
  <ProfilePanel
    title="Neuen Lauf posten"
    description="Foto, Kilometer, Zeit – fertig."
    :bleed="true"
  >
    <form @submit.prevent="onSubmit">
      <div class="flex flex-col sm:flex-row sm:gap-5">

        <!-- Linke Spalte: Foto -->
        <div class="sm:w-64 sm:shrink-0">
          <div class="rounded-2xl border border-dashed border-[var(--color-primary)]/40 bg-white/60 p-4">
            <label for="post-photo" class="block cursor-pointer">
              <div class="flex items-center justify-between gap-3">
                <div class="text-sm">
                  <p class="font-medium text-[var(--color-primary)]">Foto hinzufügen</p>
                  <p class="text-gray-500">optional</p>
                </div>
                <span
                  class="rounded-xl bg-[var(--color-primary)]/10 px-3 py-1 text-xs text-[var(--color-primary)] truncate max-w-[100px]"
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

            <div
              v-if="photoPreviewUrl"
              ref="cropContainerRef"
              class="mt-3 relative overflow-hidden rounded-xl border border-[var(--color-primary)]/40 select-none aspect-square"
              :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'"
              @mousedown="onDragStart"
              @touchstart.passive="onTouchStart"
            >
              <img
                :src="photoPreviewUrl"
                alt="Ausgewähltes Foto"
                class="absolute max-w-none pointer-events-none"
                :style="{
                  transform: `translate(${-cropOffsetX}px, ${-cropOffsetY}px)`,
                  width: scaledImageWidth ? scaledImageWidth + 'px' : '100%',
                  height: scaledImageHeight ? scaledImageHeight + 'px' : '100%',
                }"
                @load="onImageLoad"
              />
              <div class="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur-sm pointer-events-none whitespace-nowrap">
                Ziehen zum Positionieren
              </div>
            </div>

            <!-- Zoom-Slider -->
            <div v-if="photoPreviewUrl" class="mt-2 flex items-center gap-3 px-1">
              <svg class="h-4 w-4 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/>
              </svg>
              <input
                type="range"
                min="100"
                max="300"
                step="1"
                :value="Math.round(zoomFactor * 100)"
                class="w-full h-1.5 rounded-full accent-[var(--color-primary)] cursor-pointer"
                @input="onZoomSlider(($event.target as HTMLInputElement).valueAsNumber)"
              />
              <svg class="h-5 w-5 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Rechte Spalte: Felder -->
        <div class="mt-5 sm:mt-0 flex flex-col gap-5 flex-1">

          <!-- Distanz + Zeit nebeneinander -->
          <div class="flex gap-4">
            <!-- Distanz -->
            <div class="flex-1">
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
                class="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-base text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
                placeholder="z. B. 8.5"
                @input="updateField('distanceKm', ($event.target as HTMLInputElement).value)"
              />
              <p v-if="distanceError" class="mt-1 text-xs text-red-600">
                Bitte eine gültige Zahl ≥ 0 eingeben.
              </p>
            </div>

            <!-- Zeit -->
            <div class="flex-1">
              <label class="mb-2 block text-sm font-medium text-gray-700">Zeit</label>
              <div class="flex items-center gap-2">
                <input
                  id="post-hours"
                  type="number"
                  min="0"
                  max="23"
                  :value="hours"
                  class="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-base text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
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
                  class="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-base text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
                  placeholder="mm"
                  @input="updateMinutes(($event.target as HTMLInputElement).value)"
                />
              </div>
              <p v-if="timeError" class="mt-1 text-xs text-red-600">
                Bitte Stunden und Minuten korrekt eingeben.
              </p>
            </div>
          </div>

          <!-- Kurzer Text -->
          <div class="flex-1">
            <label for="post-content" class="mb-2 block text-sm font-medium text-gray-700">
              Kurzer Text (optional)
            </label>
            <textarea
              id="post-content"
              rows="3"
              :value="form.content"
              class="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
              placeholder="Ein Satz zum Lauf …"
              maxlength="240"
              @input="updateField('content', ($event.target as HTMLTextAreaElement).value)"
            />
            <div class="mt-1 text-right text-xs text-gray-400">
              <span>{{ form.content.length }}/240</span>
            </div>
          </div>

        </div>
      </div>

      <div class="mt-5 space-y-4">
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
          class="h-[40px] rounded-xl border border-gray-200 bg-white px-3 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
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
      </div>
    </form>
  </ProfilePanel>
</template>

<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'
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

/** Foto-Upload & Crop **/
function getCropSize() {
  const cw = cropContainerRef.value?.clientWidth ?? 400
  return cw // 1:1 → Höhe = Breite
}
const CROP_H = 224 // nur noch als Fallback, wird durch getCropSize() ersetzt

const imageUrl = ref<string|null>(null)
const photoFile = ref<File | null>(null)
const photoPreviewUrl = ref<string | null>(null)
const photoName = computed(() => photoFile.value?.name ?? '')

// Crop-State
const cropContainerRef = ref<HTMLElement | null>(null)
const cropOffsetX = ref(0)
const cropOffsetY = ref(0)
const isDragging = ref(false)
const imageNaturalWidth = ref(0)
const imageNaturalHeight = ref(0)
const dragStartPos = ref({ x: 0, y: 0, startOffsetX: 0, startOffsetY: 0 })
const zoomFactor = ref(1)

// Pinch-to-zoom state
const pinchStartDist = ref(0)
const pinchStartZoom = ref(1)

const cropScale = computed(() => {
  if (!cropContainerRef.value || !imageNaturalWidth.value || !imageNaturalHeight.value) return 1
  const size = getCropSize()
  const base = Math.max(size / imageNaturalWidth.value, size / imageNaturalHeight.value)
  return base * zoomFactor.value
})

const scaledImageWidth = computed(() => imageNaturalWidth.value * cropScale.value)
const scaledImageHeight = computed(() => imageNaturalHeight.value * cropScale.value)

function getMaxOffset() {
  const size = getCropSize()
  return {
    maxX: Math.max(0, scaledImageWidth.value - size),
    maxY: Math.max(0, scaledImageHeight.value - size),
  }
}

function onImageLoad(e: Event) {
  const img = e.target as HTMLImageElement
  imageNaturalWidth.value = img.naturalWidth
  imageNaturalHeight.value = img.naturalHeight
  zoomFactor.value = 1
  // Zentrieren
  const { maxX, maxY } = getMaxOffset()
  cropOffsetX.value = maxX / 2
  cropOffsetY.value = maxY / 2
}

function onZoomSlider(percent: number) {
  const size = getCropSize()
  const centerX = cropOffsetX.value + size / 2
  const centerY = cropOffsetY.value + size / 2
  const oldScale = cropScale.value
  zoomFactor.value = percent / 100
  // Nach Zoom auf gleichen Bildmittelpunkt zentrieren
  const newScale = cropScale.value
  const ratio = newScale / oldScale
  const newCenterX = centerX * ratio
  const newCenterY = centerY * ratio
  clampOffset(newCenterX - size / 2, newCenterY - size / 2)
}

function clampOffset(offsetX: number, offsetY: number) {
  const { maxX, maxY } = getMaxOffset()
  cropOffsetX.value = Math.max(0, Math.min(maxX, offsetX))
  cropOffsetY.value = Math.max(0, Math.min(maxY, offsetY))
}

function onDragStart(e: MouseEvent) {
  isDragging.value = true
  dragStartPos.value = { x: e.clientX, y: e.clientY, startOffsetX: cropOffsetX.value, startOffsetY: cropOffsetY.value }
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e: MouseEvent) {
  if (!isDragging.value) return
  clampOffset(
    dragStartPos.value.startOffsetX - (e.clientX - dragStartPos.value.x),
    dragStartPos.value.startOffsetY - (e.clientY - dragStartPos.value.y),
  )
}

function onDragEnd() {
  isDragging.value = false
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
}

function getTouchDist(e: TouchEvent) {
  const dx = e.touches[0].clientX - e.touches[1].clientX
  const dy = e.touches[0].clientY - e.touches[1].clientY
  return Math.sqrt(dx * dx + dy * dy)
}

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 2) {
    // Pinch start
    pinchStartDist.value = getTouchDist(e)
    pinchStartZoom.value = zoomFactor.value
  } else {
    const t = e.touches[0]
    isDragging.value = true
    dragStartPos.value = { x: t.clientX, y: t.clientY, startOffsetX: cropOffsetX.value, startOffsetY: cropOffsetY.value }
  }
  window.addEventListener('touchmove', onTouchMove, { passive: false })
  window.addEventListener('touchend', onTouchEnd)
}

function onTouchMove(e: TouchEvent) {
  e.preventDefault()
  if (e.touches.length === 2) {
    // Pinch zoom
    const dist = getTouchDist(e)
    const raw = pinchStartZoom.value * (dist / pinchStartDist.value)
    const clamped = Math.max(1, Math.min(3, raw))
    onZoomSlider(clamped * 100)
  } else if (isDragging.value) {
    const t = e.touches[0]
    clampOffset(
      dragStartPos.value.startOffsetX - (t.clientX - dragStartPos.value.x),
      dragStartPos.value.startOffsetY - (t.clientY - dragStartPos.value.y),
    )
  }
}

function onTouchEnd() {
  isDragging.value = false
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
}

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
})

async function cropToFile(): Promise<File> {
  const size = getCropSize()
  const scale = cropScale.value
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const img = new Image()
  img.src = photoPreviewUrl.value!
  await new Promise(resolve => { img.onload = resolve })
  ctx.drawImage(
    img,
    cropOffsetX.value / scale, cropOffsetY.value / scale,
    size / scale, size / scale,
    0, 0, size, size,
  )
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(new File([blob!], 'photo.webp', { type: 'image/webp' })), 'image/webp', 0.88)
  })
}

async function onPhotoSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0] ?? null

  if (!file) {
    photoFile.value = null
    if (photoPreviewUrl.value) URL.revokeObjectURL(photoPreviewUrl.value)
    photoPreviewUrl.value = null
    cropOffsetX.value = 0
    cropOffsetY.value = 0
    zoomFactor.value = 1
    return
  }

  try {
    const webpFile = await convertToWebP(file)
    photoFile.value = webpFile
    if (photoPreviewUrl.value) URL.revokeObjectURL(photoPreviewUrl.value)
    photoPreviewUrl.value = URL.createObjectURL(webpFile)
  } catch {
    photoFile.value = file
    if (photoPreviewUrl.value) URL.revokeObjectURL(photoPreviewUrl.value)
    photoPreviewUrl.value = URL.createObjectURL(file)
  }
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

  // 2) falls Foto vorhanden: erst croppen, dann zu Vercel Blob hochladen
  if (photoFile.value) {
    const croppedFile = await cropToFile()
    const res = await upload(croppedFile.name, croppedFile, {
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
