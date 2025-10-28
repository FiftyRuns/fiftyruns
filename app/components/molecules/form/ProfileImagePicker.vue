<script setup lang="ts">
import { computed, ref, useAttrs, watch } from 'vue'
import { upload } from '@vercel/blob/client' // ← neu
import { useCookie } from 'nuxt/app'

defineOptions({ inheritAttrs: false })

type ClassValue = string | string[] | Record<string, boolean> | undefined

const props = withDefaults(
  defineProps<{
    id?: string
    modelValue: File | null
    imageUrl?: string | null              
    autoUpload?: boolean                   
    handleUploadUrl?: string             
    access?: 'public'
    csrfToken?: string | null
    label?: string
    error?: string
    maxSize?: number
    wrapperClass?: ClassValue
    containerClass?: ClassValue
    labelClass?: ClassValue
    errorClass?: ClassValue
    uploadLabel?: string
    changeLabel?: string
    emptyStateText?: string
  }>(),
  {
    id: 'profilePicture',
    imageUrl: null,
    autoUpload: true,
    handleUploadUrl: '/api/blob.upload',
    access: 'public',
    csrfToken: null,
    label: 'Profilbild',
    maxSize: 2 * 1024 * 1024,
    uploadLabel: 'Bild hochladen',
    changeLabel: 'Neues Bild auswählen',
    emptyStateText: 'Klicke, um ein Bild hochzuladen',
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
const csrfCookie = useCookie<string | null>('csrf_token')
const csrfHeader = computed(() => props.csrfToken ?? csrfCookie.value ?? null)

const inputAttrs = computed(() => {
  const { class: _class, ...rest } = attrs as Record<string, unknown>
  return rest
})

const wrapperClasses = computed(() => ['flex flex-col', props.wrapperClass])
const containerClasses = computed(() => [
  'relative mx-auto h-32 w-32 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-[var(--color-primary)] focus-within:border-[var(--color-primary)]',
  props.containerClass,
])
const labelClasses = computed(() => ['mb-2 block text-sm font-semibold text-gray-800', props.labelClass])
const errorId = computed(() => (props.error ? `${props.id ?? 'file'}-error` : undefined))
const errorClasses = computed(() => ['mt-2 text-center text-xs text-red-600', props.errorClass])
const formattedMaxSize = computed(() => {
  const sizeMb = props.maxSize / (1024 * 1024)
  return Number.isInteger(sizeMb) ? String(sizeMb) : sizeMb.toFixed(1)
})

function resetInput() {
  preview.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

async function convertToWebP(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Konvertierung fehlgeschlagen'))
            return
          }
          const webpFile = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
            type: 'image/webp'
          })
          resolve(webpFile)
        },
        'image/webp',
        0.85 // 85% quality
      )
    }
    
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

function setError(message: string | undefined) {
  emit('error', message)
}

async function onSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  if (!file) {
    emit('update:modelValue', null)
    resetInput()
    return
  }

  if (!file.type.startsWith('image/')) {
    setError('Nur Bilddateien sind erlaubt.')
    emit('update:modelValue', null)
    resetInput()
    return
  }

  if (file.size > props.maxSize) {
    setError(`Bild darf höchstens ${formattedMaxSize.value} MB groß sein.`)
    emit('update:modelValue', null)
    resetInput()
    return
  }

  try {
    // Konvertiere zu WebP
    const webpFile = await convertToWebP(file)
    
    preview.value = await toDataUrl(file) // Preview aus original (schneller)
    setError(undefined)
    emit('update:modelValue', webpFile) // Emit WebP file

    if (props.autoUpload && props.handleUploadUrl) {
      uploading.value = true
      try {
        const res = await upload(webpFile.name, webpFile, {
          access: props.access,
          handleUploadUrl: props.handleUploadUrl,
          multipart: true,
          ...(csrfHeader.value ? { headers: { 'x-csrf-token': csrfHeader.value } } : {}),
        })
        emit('uploaded', res.url)           // Event
        emit('update:imageUrl', res.url)    // v-model:imageUrl
      } finally {
        uploading.value = false
      }
    }
  } catch {
    setError('Bild konnte nicht geladen/hochgeladen werden.')
    emit('update:modelValue', null)
    resetInput()
  }
}

watch(
  () => props.modelValue,
  async (file) => {
    if (!file) {
      resetInput()
      return
    }
    try {
      preview.value = await toDataUrl(file)
    } catch {
      resetInput()
    }
  },
  { immediate: true }
)
</script>

<template>
  <div :class="wrapperClasses">
    <label v-if="props.label" :for="props.id" :class="labelClasses">
      <slot name="label">{{ props.label }}</slot>
    </label>

    <div :class="containerClasses">
      <input
        ref="fileInput"
        :id="props.id"
        type="file"
        accept="image/*"
        class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        :aria-invalid="Boolean(props.error)"
        :aria-describedby="errorId"
        :aria-label="preview ? props.changeLabel : props.uploadLabel"
        @change="onSelect"
        v-bind="inputAttrs"
      />

      <template v-if="preview">
        <img :src="preview" alt="Profilbild Vorschau" class="h-full w-full rounded-full object-cover opacity-100" />
        <div v-if="uploading" class="absolute inset-0 grid place-items-center bg-black/30 text-white text-xs">
          lädt …
        </div>
      </template>

      <template v-else>
        <slot name="empty">
          <div class="flex h-full flex-col items-center justify-center px-2 text-center text-gray-400">
            <!-- Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" class="mb-2 h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M5.121 17.804A7 7 0 0112 15a7 7 0 016.879 2.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span class="select-none text-xs">{{ props.emptyStateText }}</span>
          </div>
        </slot>
      </template>
    </div>

    <p v-if="props.error" :id="errorId" :class="errorClasses">
      <slot name="error">{{ props.error }}</slot>
    </p>
  </div>
</template>
