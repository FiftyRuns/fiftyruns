<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'
import { upload } from '@vercel/blob/client'
import { Icon } from '@iconify/vue'
import { useCookie } from 'nuxt/app'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    id?: string
    modelValue: File | null
    imageUrl?: string | null
    autoUpload?: boolean
    handleUploadUrl?: string
    csrfToken?: string | null
    label?: string
    error?: string
    maxSize?: number
  }>(),
  {
    id: 'challengeImage',
    imageUrl: null,
    autoUpload: true,
    handleUploadUrl: '/api/challenges/upload',
    csrfToken: null,
    label: 'Challenge-Titelbild',
    maxSize: 10 * 1024 * 1024, // 10MB
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: File | null): void
  (e: 'update:imageUrl', v: string | null): void
  (e: 'uploaded', url: string): void
  (e: 'error', message: string | undefined): void
}>()

const attrs = useAttrs()
const fileInput = ref<HTMLInputElement | null>(null)
const preview = ref('')
const uploading = ref(false)
const error = ref<string | undefined>(props.error)
const csrfCookie = useCookie<string | null>('csrf_token')
const csrfHeader = computed(() => props.csrfToken ?? csrfCookie.value ?? null)

const inputAttrs = computed(() => {
  const { class: _class, ...rest } = attrs as Record<string, unknown>
  return rest
})

const formattedMaxSize = computed(() => {
  const sizeMb = props.maxSize / (1024 * 1024)
  return Number.isInteger(sizeMb) ? String(sizeMb) : sizeMb.toFixed(1)
})

// Crop-State
type Phase = 'empty' | 'cropping' | 'done'
const phase = ref<Phase>('empty')
const cropContainerRef = ref<HTMLElement | null>(null)
const rawPreviewUrl = ref<string | null>(null)
const pendingWebpFile = ref<File | null>(null)

const cropOffsetX = ref(0)
const cropOffsetY = ref(0)
const isDragging = ref(false)
const imageNaturalWidth = ref(0)
const imageNaturalHeight = ref(0)
const dragStartPos = ref({ x: 0, y: 0, startOffsetX: 0, startOffsetY: 0 })
const zoomFactor = ref(1)
const pinchStartDist = ref(0)
const pinchStartZoom = ref(1)

function getCropDimensions() {
  const cw = cropContainerRef.value?.clientWidth ?? 640
  const ch = cropContainerRef.value?.clientHeight ?? 240
  return { w: cw, h: ch }
}

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

function clampOffset(offsetX: number, offsetY: number) {
  const { maxX, maxY } = getMaxOffset()
  cropOffsetX.value = Math.max(0, Math.min(maxX, offsetX))
  cropOffsetY.value = Math.max(0, Math.min(maxY, offsetY))
}

function onImageLoad(e: Event) {
  const img = e.target as HTMLImageElement
  imageNaturalWidth.value = img.naturalWidth
  imageNaturalHeight.value = img.naturalHeight
  zoomFactor.value = 1
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
  const newScale = cropScale.value
  const ratio = newScale / oldScale
  clampOffset(centerX * ratio - w / 2, centerY * ratio - h / 2)
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
    const dist = getTouchDist(e)
    const raw = pinchStartZoom.value * (dist / pinchStartDist.value)
    onZoomSlider(Math.max(1, Math.min(3, raw)) * 100)
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
  if (rawPreviewUrl.value) URL.revokeObjectURL(rawPreviewUrl.value)
})

async function cropToFile(): Promise<File> {
  const { w, h } = getCropDimensions()
  const scale = cropScale.value
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const img = new Image()
  img.src = rawPreviewUrl.value!
  await new Promise(resolve => { img.onload = resolve })
  ctx.drawImage(
    img,
    cropOffsetX.value / scale, cropOffsetY.value / scale,
    w / scale, h / scale,
    0, 0, w, h,
  )
  return new Promise(resolve => {
    canvas.toBlob(
      blob => resolve(new File([blob!], 'challenge-image.webp', { type: 'image/webp' })),
      'image/webp',
      0.92,
    )
  })
}

function setError(message?: string) {
  error.value = message
  emit('error', message)
}

async function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function onSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  if (!file) return

  if (!file.type.startsWith('image/')) {
    setError('Nur Bilddateien sind erlaubt.')
    return
  }

  if (file.size > props.maxSize) {
    setError(`Bild darf höchstens ${formattedMaxSize.value} MB groß sein.`)
    return
  }

  try {
    const webpFile = await convertToWebP(file)
    pendingWebpFile.value = webpFile
    if (rawPreviewUrl.value) URL.revokeObjectURL(rawPreviewUrl.value)
    rawPreviewUrl.value = URL.createObjectURL(webpFile)
    setError(undefined)
    phase.value = 'cropping'
    // Reset crop state
    cropOffsetX.value = 0
    cropOffsetY.value = 0
    zoomFactor.value = 1
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Bild konnte nicht konvertiert werden.')
  }
}

async function confirmCrop() {
  if (!pendingWebpFile.value) return
  uploading.value = true
  try {
    const croppedFile = await cropToFile()
    preview.value = await toDataUrl(croppedFile)
    emit('update:modelValue', croppedFile)
    phase.value = 'done'

    if (props.autoUpload && props.handleUploadUrl) {
      const res = await upload(croppedFile.name, croppedFile, {
        access: 'public',
        handleUploadUrl: props.handleUploadUrl,
        multipart: true,
        ...(csrfHeader.value ? { headers: { 'x-csrf-token': csrfHeader.value } } : {}),
      })
      emit('uploaded', res.url)
      emit('update:imageUrl', res.url)
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Bild konnte nicht hochgeladen werden.')
  } finally {
    uploading.value = false
  }
}

function removeImage() {
  emit('update:modelValue', null)
  emit('update:imageUrl', null)
  setError(undefined)
  preview.value = ''
  pendingWebpFile.value = null
  if (rawPreviewUrl.value) URL.revokeObjectURL(rawPreviewUrl.value)
  rawPreviewUrl.value = null
  phase.value = 'empty'
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <label v-if="label" class="text-sm font-medium text-gray-700">
      {{ label }}
    </label>

    <!-- Phase: Crop-Editor -->
    <div v-if="phase === 'cropping'" class="flex flex-col gap-2">
      <div
        ref="cropContainerRef"
        class="relative overflow-hidden rounded-xl border border-[var(--color-primary)]/30 select-none aspect-[16/7]"
        :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'"
        @mousedown="onDragStart"
        @touchstart.passive="onTouchStart"
      >
        <img
          :src="rawPreviewUrl ?? undefined"
          alt="Bildausschnitt wählen"
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
      <div class="flex items-center gap-3 px-1">
        <svg class="h-3.5 w-3.5 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/>
        </svg>
        <input
          type="range" min="100" max="300" step="1"
          :value="Math.round(zoomFactor * 100)"
          class="w-full h-1.5 rounded-full accent-[var(--color-primary)] cursor-pointer"
          @input="onZoomSlider(($event.target as HTMLInputElement).valueAsNumber)"
        />
        <svg class="h-5 w-5 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/>
        </svg>
      </div>

      <!-- Aktionen -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          @click="removeImage"
        >
          Abbrechen
        </button>
        <button
          type="button"
          class="flex-1 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
          :disabled="uploading"
          @click="confirmCrop"
        >
          <span v-if="uploading" class="flex items-center justify-center gap-2">
            <Icon icon="ph:spinner" class="h-4 w-4 animate-spin" />
            Wird hochgeladen…
          </span>
          <span v-else>Bestätigen</span>
        </button>
      </div>
    </div>

    <!-- Phase: Fertig (Vorschau) -->
    <div v-else-if="phase === 'done' || imageUrl" class="group relative">
      <img
        :src="preview || imageUrl || undefined"
        alt="Vorschau"
        class="w-full rounded-xl border border-black/10 object-cover bg-gray-100 aspect-[16/7]"
      />
      <button
        v-if="!uploading"
        type="button"
        class="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white opacity-0 transition hover:bg-black/70 group-hover:opacity-100"
        @click="removeImage"
      >
        <Icon icon="ph:x" class="h-4 w-4" />
      </button>
      <div v-if="uploading" class="absolute inset-0 flex items-center justify-center rounded-xl bg-black/30">
        <Icon icon="ph:spinner" class="h-8 w-8 animate-spin text-white" />
      </div>
    </div>

    <!-- Phase: Leer (Upload-Zone) -->
    <div v-else>
      <input
        :id="id"
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        v-bind="inputAttrs"
        @change="onSelect"
      />
      <label
        :for="id"
        class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition hover:border-[var(--color-primary)] hover:bg-gray-100"
      >
        <Icon icon="ph:cloud-arrow-up-duotone" class="h-12 w-12 text-gray-400" />
        <div class="text-center">
          <p class="text-sm font-semibold text-gray-700">Bild hochladen</p>
          <p class="text-xs text-gray-500">Max. {{ formattedMaxSize }} MB</p>
        </div>
      </label>
    </div>

    <p v-if="error" class="text-xs text-red-600">
      {{ error }}
    </p>
  </div>
</template>
