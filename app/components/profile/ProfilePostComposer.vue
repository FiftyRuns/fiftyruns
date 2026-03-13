<template>
  <ProfilePanel
    title="Neuen Lauf posten"
    description="Foto, Kilometer, Zeit – fertig."
    :bleed="true"
  >
    <form @submit.prevent="onSubmit" class="flex flex-col gap-4 pt-2">

      <!-- Distanz + Zeit nebeneinander -->
      <div class="flex gap-3">
        <!-- Distanz -->
        <div class="flex-1">
          <label for="post-distance" class="mb-1.5 block text-sm font-medium text-gray-700">
            Distanz (km)
          </label>
          <input
            id="post-distance"
            type="text"
            inputmode="decimal"
            :value="form.distanceKm"
            class="w-full rounded-xl border bg-white px-3 py-2.5 text-base text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
            :class="distanceTouched && distanceError ? 'border-red-400' : 'border-gray-200'"
            placeholder="z. B. 8,5"
            @input="distanceTouched = true; updateField('distanceKm', ($event.target as HTMLInputElement).value)"
          />
          <p v-if="distanceTouched && distanceError" class="mt-1 text-xs text-red-600">
            Gültige Zahl ≥ 0 eingeben.
          </p>
        </div>

        <!-- Zeit -->
        <div class="flex-1">
          <label class="mb-1.5 block text-sm font-medium text-gray-700">Zeit (hh:mm:ss)</label>
          <div class="flex items-center gap-1.5">
            <input
              id="post-hours"
              ref="hoursRef"
              type="text"
              inputmode="numeric"
              maxlength="2"
              :value="hours"
              class="w-full rounded-xl border bg-white px-3 py-2.5 text-base text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
              :class="timeTouched && timeError ? 'border-red-400' : 'border-gray-200'"
              placeholder="hh"
              @input="onTimeInput('h', $event)"
            />
            <span class="text-gray-400 font-medium">:</span>
            <input
              id="post-minutes"
              ref="minutesRef"
              type="text"
              inputmode="numeric"
              maxlength="2"
              :value="minutes"
              class="w-full rounded-xl border bg-white px-3 py-2.5 text-base text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
              :class="timeTouched && timeError ? 'border-red-400' : 'border-gray-200'"
              placeholder="mm"
              @input="onTimeInput('m', $event)"
            />
            <span class="text-gray-400 font-medium">:</span>
            <input
              id="post-seconds"
              ref="secondsRef"
              type="text"
              inputmode="numeric"
              maxlength="2"
              :value="seconds"
              class="w-full rounded-xl border bg-white px-3 py-2.5 text-base text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
              :class="timeTouched && timeError ? 'border-red-400' : 'border-gray-200'"
              placeholder="ss"
              @input="onTimeInput('s', $event)"
            />
          </div>
          <p v-if="timeTouched && timeError" class="mt-1 text-xs text-red-600">
            Stunden (0–23), Minuten (0–59) und Sekunden (0–59) eingeben.
          </p>
        </div>
      </div>

      <!-- Datum & Uhrzeit -->
      <div>
        <label class="mb-1.5 block text-sm font-medium text-gray-700">Datum & Uhrzeit</label>
        <div class="grid grid-cols-2 gap-2">
          <input type="date" :value="dtDateValue"
            class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
            @change="onDateChange($event)" />
          <input type="time" :value="dtTimeValue"
            class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
            @change="onTimeChange($event)" />
        </div>
      </div>

      <!-- Kurzer Text -->
      <div>
        <div class="mb-1.5 flex items-center justify-between gap-2">
          <label for="post-content" class="text-sm font-medium text-gray-700">
            Beschreibung <span class="text-gray-400 font-normal">(optional)</span>
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
          rows="3"
          :value="form.content"
          class="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
          placeholder="Ein Satz zum Lauf …"
          maxlength="240"
          @input="updateField('content', ($event.target as HTMLTextAreaElement).value)"
        />
        <div class="mt-1 text-right text-xs text-gray-400">{{ form.content.length }}/240</div>
        <p v-if="aiError" class="mt-1 text-xs text-red-600">{{ aiError }}</p>
      </div>

      <!-- Foto (kompakt) -->
      <div class="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-3">
        <label for="post-photo" class="flex cursor-pointer items-center gap-3">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-gray-700">
              {{ photoName ? photoName : 'Foto hinzufügen' }}
            </p>
            <p class="text-xs text-gray-400">{{ photoName ? 'Klicken zum Ändern' : 'optional · JPG, PNG, WebP' }}</p>
          </div>
          <input id="post-photo" type="file" accept="image/*" class="sr-only" @change="onPhotoSelected" />
        </label>

        <!-- Crop-Vorschau -->
        <div v-if="photoPreviewUrl" class="mt-3">
          <div
            ref="cropContainerRef"
            class="relative overflow-hidden rounded-xl border border-[var(--color-primary)]/30 select-none aspect-video"
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
          <div class="mt-2 flex items-center gap-3 px-1">
            <svg class="h-3.5 w-3.5 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/>
            </svg>
            <input
              type="range" min="100" max="300" step="1"
              :value="Math.round(zoomFactor * 100)"
              class="w-full h-1.5 rounded-full accent-[var(--color-primary)] cursor-pointer"
              @input="onZoomSlider(($event.target as HTMLInputElement).valueAsNumber)"
            />
            <svg class="h-4.5 w-4.5 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Aktionen -->
      <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-gray-500">Sichtbarkeit</label>
          <select
            class="h-[38px] rounded-xl border border-gray-200 bg-white px-3 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
            :value="form.visibility"
            @change="updateField('visibility', ($event.target as HTMLSelectElement).value as Visibility)"
          >
            <option value="public">Öffentlich</option>
            <option value="protected">Community</option>
            <option value="private">Nur ich</option>
          </select>
        </div>

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
import { computed, ref, onBeforeUnmount } from 'vue'
const distanceTouched = ref(false)
const timeTouched = ref(false)
const aiLoading = ref(false)
const aiError = ref('')
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
function getCropDimensions() {
  const cw = cropContainerRef.value?.clientWidth ?? 560
  const ch = cropContainerRef.value?.clientHeight ?? 315 // 16:9
  return { w: cw, h: ch }
}
// kept for backwards compat with callers that only need width
function getCropSize() {
  return getCropDimensions().w
}

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
  const { w, h } = getCropDimensions()
  const base = Math.max(w / imageNaturalWidth.value, h / imageNaturalHeight.value)
  return base * zoomFactor.value
})

const scaledImageWidth = computed(() => imageNaturalWidth.value * cropScale.value)
const scaledImageHeight = computed(() => imageNaturalHeight.value * cropScale.value)

function getMaxOffset() {
  const { w, h } = getCropDimensions()
  return {
    maxX: Math.max(0, scaledImageWidth.value - w),
    maxY: Math.max(0, scaledImageHeight.value - h),
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
  const { w, h } = getCropDimensions()
  const centerX = cropOffsetX.value + w / 2
  const centerY = cropOffsetY.value + h / 2
  const oldScale = cropScale.value
  zoomFactor.value = percent / 100
  // Nach Zoom auf gleichen Bildmittelpunkt zentrieren
  const newScale = cropScale.value
  const ratio = newScale / oldScale
  const newCenterX = centerX * ratio
  const newCenterY = centerY * ratio
  clampOffset(newCenterX - w / 2, newCenterY - h / 2)
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
  const { w, h } = getCropDimensions()
  const scale = cropScale.value
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const img = new Image()
  img.src = photoPreviewUrl.value!
  await new Promise(resolve => { img.onload = resolve })
  ctx.drawImage(
    img,
    cropOffsetX.value / scale, cropOffsetY.value / scale,
    w / scale, h / scale,
    0, 0, w, h,
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
const seconds = ref('')
const hoursRef = ref<HTMLInputElement | null>(null)
const minutesRef = ref<HTMLInputElement | null>(null)
const secondsRef = ref<HTMLInputElement | null>(null)

function onTimeInput(field: 'h' | 'm' | 's', event: Event) {
  const input = event.target as HTMLInputElement
  const raw = input.value.replace(/\D/g, '').slice(0, 2)
  input.value = raw
  timeTouched.value = true

  if (field === 'h') {
    hours.value = raw
    updateField('duration', `${(raw || '0').padStart(2, '0')}:${(minutes.value || '0').padStart(2, '0')}:${(seconds.value || '0').padStart(2, '0')}`)
    if (raw.length === 2) minutesRef.value?.focus()
  } else if (field === 'm') {
    minutes.value = raw
    updateField('duration', `${(hours.value || '0').padStart(2, '0')}:${(raw || '0').padStart(2, '0')}:${(seconds.value || '0').padStart(2, '0')}`)
    if (raw.length === 2) secondsRef.value?.focus()
  } else {
    seconds.value = raw
    updateField('duration', `${(hours.value || '0').padStart(2, '0')}:${(minutes.value || '0').padStart(2, '0')}:${(raw || '0').padStart(2, '0')}`)
  }
}

const timeError = computed(() => {
  const h = Number(hours.value || 0)
  const m = Number(minutes.value || 0)
  const s = Number(seconds.value || 0)
  return (
    !Number.isFinite(h) ||
    !Number.isFinite(m) ||
    !Number.isFinite(s) ||
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59 ||
    s < 0 ||
    s > 59
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
  const h = Number(hours.value || 0)
  const m = Number(minutes.value || 0)
  const s = Number(seconds.value || 0)
  return h * 3600 + m * 60 + s
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


/** Datum & Zeit Felder **/
const dtDateValue = computed(() => {
  const d = form.value.createdAt ? new Date(form.value.createdAt) : new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const dtTimeValue = computed(() => {
  const d = form.value.createdAt ? new Date(form.value.createdAt) : new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})

function onDateChange(event: Event) {
  const dateStr = (event.target as HTMLInputElement).value
  if (!dateStr) return
  const [year, month, day] = dateStr.split('-')
  const time = dtTimeValue.value
  const d = new Date(`${year}-${month}-${day}T${time}:00`)
  if (!isNaN(d.getTime())) updateField('createdAt', d.toISOString())
}

function onTimeChange(event: Event) {
  const timeStr = (event.target as HTMLInputElement).value
  if (!timeStr) return
  const date = dtDateValue.value
  const d = new Date(`${date}T${timeStr}:00`)
  if (!isNaN(d.getTime())) updateField('createdAt', d.toISOString())
}

async function reformulateWithAi() {
  aiLoading.value = true
  aiError.value = ''
  try {
    const { text } = await $fetch<{ text: string }>('/api/ai/reformulate', {
      method: 'POST',
      body: {
        text: form.value.content || '',
        distanceKm: form.value.distanceKm || '',
        duration: form.value.duration || '',
      },
      credentials: 'include',
    })
    updateField('content', text)
  } catch {
    aiError.value = 'KI-Umformulierung fehlgeschlagen. Bitte erneut versuchen.'
  } finally {
    aiLoading.value = false
  }
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
