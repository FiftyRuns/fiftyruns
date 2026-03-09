<template>
  <ProfilePanel
    title="Profilbild"
    description="Gib deinem Profil ein Gesicht – quadratische Bilder funktionieren am besten."
    padded
    :collapsible="props.collapsible"
    :default-open="props.defaultOpen"
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

  <!-- Crop-Modal -->
  <Teleport to="body">
    <div
      v-if="cropPhotoUrl"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      @click.self="cancelCrop"
    >
      <div class="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <h3 class="mb-3 text-base font-semibold text-gray-800">Bild zuschneiden</h3>

        <!-- Crop-Bereich -->
        <div
          ref="cropContainerRef"
          class="relative overflow-hidden rounded-full border-4 border-[var(--color-primary)]/40 select-none aspect-square"
          :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'"
          @mousedown="onDragStart"
          @touchstart.passive="onTouchStart"
        >
          <img
            :src="cropPhotoUrl"
            alt="Profilbild bearbeiten"
            class="absolute max-w-none pointer-events-none"
            :style="{
              transform: `translate(${-cropOffsetX}px, ${-cropOffsetY}px)`,
              width: scaledImageWidth ? scaledImageWidth + 'px' : '100%',
              height: scaledImageHeight ? scaledImageHeight + 'px' : '100%',
            }"
            @load="onImageLoad"
          />
          <div class="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur-sm pointer-events-none whitespace-nowrap">
            Ziehen zum Positionieren
          </div>
        </div>

        <!-- Zoom-Slider -->
        <div class="mt-3 flex items-center gap-3 px-1">
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

        <!-- Buttons -->
        <div class="mt-4 flex justify-end gap-3">
          <FormButton variant="secondary" label="Abbrechen" @click="cancelCrop" />
          <FormButton variant="primary" label="Übernehmen" @click="confirmCrop" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue'
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
  collapsible?: boolean
  defaultOpen?: boolean
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
const currentUrl = ref<string | null>(props.preview ?? props.user.image ?? null)
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

// ── Crop-Editor ──────────────────────────────────────────────────────────────

const cropPhotoUrl = ref<string | null>(null)
const cropContainerRef = ref<HTMLElement | null>(null)
const cropOffsetX = ref(0)
const cropOffsetY = ref(0)
const isDragging = ref(false)
const imageNaturalWidth = ref(0)
const imageNaturalHeight = ref(0)
const dragStartPos = ref({ x: 0, y: 0, startOffsetX: 0, startOffsetY: 0 })
const zoomFactor = ref(1)
const pinchStartDist = ref(0)
const pinchStartZoom = ref(1)

function getCropSize() {
  return cropContainerRef.value?.clientWidth ?? 320
}

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
  const newScale = cropScale.value
  const ratio = newScale / oldScale
  clampOffset(centerX * ratio - size / 2, centerY * ratio - size / 2)
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
})

async function cropToFile(): Promise<File> {
  const size = getCropSize()
  const scale = cropScale.value
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const img = new Image()
  img.src = cropPhotoUrl.value!
  await new Promise(resolve => { img.onload = resolve })
  ctx.drawImage(
    img,
    cropOffsetX.value / scale, cropOffsetY.value / scale,
    size / scale, size / scale,
    0, 0, size, size,
  )
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(new File([blob!], 'avatar.webp', { type: 'image/webp' })), 'image/webp', 0.92)
  })
}

// ── File-Handling ─────────────────────────────────────────────────────────────

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0] ?? null

  if (!file) {
    emit('select-picture', null)
    return
  }

  if (!file.type.startsWith('image/')) {
    setError('Nur Bilddateien sind erlaubt.')
    input.value = ''
    emit('select-picture', null)
    return
  }

  // Öffne Crop-Editor (Größenbeschränkung wird nach dem Crop geprüft)
  if (cropPhotoUrl.value) URL.revokeObjectURL(cropPhotoUrl.value)
  try {
    const webpFile = await convertToWebP(file)
    cropPhotoUrl.value = URL.createObjectURL(webpFile)
  } catch {
    cropPhotoUrl.value = URL.createObjectURL(file)
  }
  if (fileInput.value) fileInput.value.value = ''
  setError()
}

function cancelCrop() {
  if (cropPhotoUrl.value) URL.revokeObjectURL(cropPhotoUrl.value)
  cropPhotoUrl.value = null
  cropOffsetX.value = 0
  cropOffsetY.value = 0
  zoomFactor.value = 1
}

async function confirmCrop() {
  const croppedFile = await cropToFile()

  const MAX = 2 * 1024 * 1024
  if (croppedFile.size > MAX) {
    setError('Bild darf höchstens 2 MB groß sein.')
    cancelCrop()
    return
  }

  pendingFile.value = croppedFile
  preview.value = URL.createObjectURL(croppedFile)
  cancelCrop()
  setError()
  emit('select-picture', croppedFile)
}

// ── Upload / Remove ───────────────────────────────────────────────────────────

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
