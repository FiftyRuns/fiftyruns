<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { upload } from '@vercel/blob/client'
import { Icon } from '@iconify/vue'
import { useCookie } from 'nuxt/app'

const PREVIEW_SIZE = 80
const EXPORT_SIZE = 400

const props = withDefaults(
  defineProps<{
    modelValue?: string
    handleUploadUrl?: string
    csrfToken?: string | null
    maxSize?: number
  }>(),
  {
    modelValue: '',
    handleUploadUrl: '/api/challenges/upload',
    csrfToken: null,
    maxSize: 5 * 1024 * 1024,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const error = ref('')
const csrfCookie = useCookie<string | null>('csrf_token')
const csrfHeader = computed(() => props.csrfToken ?? csrfCookie.value ?? null)

const editor = reactive({
  file: null as File | null,
  preview: '',
  naturalWidth: 0,
  naturalHeight: 0,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  dragOriginX: 0,
  dragOriginY: 0,
})

const formattedMaxSize = computed(() => {
  const sizeMb = props.maxSize / (1024 * 1024)
  return Number.isInteger(sizeMb) ? String(sizeMb) : sizeMb.toFixed(1)
})

const displayScale = computed(() => {
  if (!editor.naturalWidth || !editor.naturalHeight) return editor.zoom
  const baseScale = PREVIEW_SIZE / Math.min(editor.naturalWidth, editor.naturalHeight)
  return baseScale * editor.zoom
})

const editorImageStyle = computed(() => ({
  transform: `translate(calc(-50% + ${editor.offsetX}px), calc(-50% + ${editor.offsetY}px)) scale(${displayScale.value})`,
  transformOrigin: 'center center',
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  width: `${editor.naturalWidth}px`,
  height: `${editor.naturalHeight}px`,
}))

function setOffsets(x: number, y: number) {
  const drawWidth = editor.naturalWidth * displayScale.value
  const drawHeight = editor.naturalHeight * displayScale.value
  const maxOffsetX = Math.max(0, (drawWidth - PREVIEW_SIZE) / 2)
  const maxOffsetY = Math.max(0, (drawHeight - PREVIEW_SIZE) / 2)
  editor.offsetX = Math.min(Math.max(x, -maxOffsetX), maxOffsetX)
  editor.offsetY = Math.min(Math.max(y, -maxOffsetY), maxOffsetY)
}

function onPointerDown(event: PointerEvent) {
  if (!editor.preview) return
  editor.isDragging = true
  editor.dragStartX = event.clientX
  editor.dragStartY = event.clientY
  editor.dragOriginX = editor.offsetX
  editor.dragOriginY = editor.offsetY
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!editor.isDragging) return
  const deltaX = event.clientX - editor.dragStartX
  const deltaY = event.clientY - editor.dragStartY
  setOffsets(editor.dragOriginX + deltaX, editor.dragOriginY + deltaY)
}

function onPointerUp() {
  editor.isDragging = false
}

function onZoomChange(event: Event) {
  editor.zoom = Number((event.target as HTMLInputElement).value)
  setOffsets(editor.offsetX, editor.offsetY)
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
    error.value = 'Nur Bilddateien sind erlaubt.'
    resetInput()
    return
  }

  if (file.size > props.maxSize) {
    error.value = `Bild darf höchstens ${formattedMaxSize.value} MB groß sein.`
    resetInput()
    return
  }

  error.value = ''
  editor.file = file
  editor.zoom = 1
  editor.offsetX = 0
  editor.offsetY = 0

  const url = URL.createObjectURL(file)
  await new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = () => {
      editor.naturalWidth = img.naturalWidth
      editor.naturalHeight = img.naturalHeight
      URL.revokeObjectURL(url)
      resolve()
    }
    img.src = url
  })

  editor.preview = await toDataUrl(file)
}

async function exportBlob(): Promise<File | null> {
  if (!editor.preview || !editor.naturalWidth) return null

  const img = new Image()
  await new Promise<void>((resolve) => {
    img.onload = () => resolve()
    img.src = editor.preview
  })

  const scale = displayScale.value
  const drawWidth = editor.naturalWidth * scale
  const drawHeight = editor.naturalHeight * scale

  const sourceX = (drawWidth - PREVIEW_SIZE) / 2 - editor.offsetX
  const sourceY = (drawHeight - PREVIEW_SIZE) / 2 - editor.offsetY

  const srcX = sourceX / scale
  const srcY = sourceY / scale
  const srcW = PREVIEW_SIZE / scale
  const srcH = PREVIEW_SIZE / scale

  const canvas = document.createElement('canvas')
  canvas.width = EXPORT_SIZE
  canvas.height = EXPORT_SIZE
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, EXPORT_SIZE, EXPORT_SIZE)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/webp', 0.9)
  )
  if (!blob) return null
  return new File([blob], `sponsor-logo-${Date.now()}.webp`, { type: 'image/webp' })
}

async function confirmUpload() {
  const file = await exportBlob()
  if (!file) return

  uploading.value = true
  try {
    const res = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: props.handleUploadUrl,
      multipart: true,
      ...(csrfHeader.value ? { headers: { 'x-csrf-token': csrfHeader.value } } : {}),
    })
    emit('update:modelValue', res.url)
    editor.preview = ''
    editor.file = null
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Upload fehlgeschlagen.'
  } finally {
    uploading.value = false
    resetInput()
  }
}

function cancelEditor() {
  editor.preview = ''
  editor.file = null
  error.value = ''
  resetInput()
}

function removeImage() {
  emit('update:modelValue', '')
  error.value = ''
  cancelEditor()
}

function resetInput() {
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- Editor: Bild ausgewählt, noch nicht hochgeladen -->
    <div v-if="editor.preview" class="flex flex-col gap-2">
      <div
        class="relative overflow-hidden rounded-lg border border-black/10 bg-gray-100 cursor-grab active:cursor-grabbing select-none"
        :style="{ width: `${PREVIEW_SIZE}px`, height: `${PREVIEW_SIZE}px` }"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <img
          :src="editor.preview"
          alt="Sponsor-Logo Vorschau"
          draggable="false"
          :style="editorImageStyle"
        />
      </div>

      <!-- Zoom-Slider -->
      <input
        type="range"
        min="1"
        max="3"
        step="0.05"
        :value="editor.zoom"
        class="w-20 accent-[var(--color-primary)]"
        @input="onZoomChange"
      />

      <!-- Bestätigen / Abbrechen -->
      <div class="flex gap-1">
        <button
          type="button"
          class="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)] text-white transition hover:opacity-80"
          :disabled="uploading"
          @click="confirmUpload"
        >
          <Icon v-if="!uploading" icon="ph:check" class="h-3.5 w-3.5" />
          <Icon v-else icon="ph:spinner" class="h-3.5 w-3.5 animate-spin" />
        </button>
        <button
          type="button"
          class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition hover:bg-gray-300"
          :disabled="uploading"
          @click="cancelEditor"
        >
          <Icon icon="ph:x" class="h-3.5 w-3.5" />
        </button>
      </div>
    </div>

    <!-- Hochgeladenes Logo -->
    <div v-else-if="modelValue" class="relative">
      <img
        :src="modelValue"
        alt="Sponsor-Logo"
        class="h-20 w-20 rounded-lg border border-black/10 object-cover bg-gray-100"
      />
      <button
        type="button"
        class="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white transition hover:bg-red-600"
        @click="removeImage"
      >
        <Icon icon="ph:x" class="h-3 w-3" />
      </button>
    </div>

    <!-- Leer: Upload-Button -->
    <div v-else>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onSelect"
      />
      <button
        type="button"
        class="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-[var(--color-primary)] hover:bg-gray-100"
        @click="fileInput?.click()"
      >
        <Icon icon="ph:plus-circle-duotone" class="h-6 w-6 text-gray-400" />
      </button>
    </div>

    <p v-if="error" class="text-[10px] text-red-600">
      {{ error }}
    </p>
  </div>
</template>

