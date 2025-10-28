<script setup lang="ts">
import { computed, ref } from 'vue'
import { upload } from '@vercel/blob/client'
import { Icon } from '@iconify/vue'
import { useCookie } from 'nuxt/app'

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
    maxSize: 5 * 1024 * 1024, // 5MB per logo
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const preview = ref('')
const uploading = ref(false)
const error = ref('')
const csrfCookie = useCookie<string | null>('csrf_token')
const csrfHeader = computed(() => props.csrfToken ?? csrfCookie.value ?? null)

const formattedMaxSize = computed(() => {
  const sizeMb = props.maxSize / (1024 * 1024)
  return Number.isInteger(sizeMb) ? String(sizeMb) : sizeMb.toFixed(1)
})

async function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

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

async function onSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  if (!file) {
    resetInput()
    return
  }

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

  try {
    // Konvertiere zu WebP
    const webpFile = await convertToWebP(file)
    
    preview.value = await toDataUrl(file) // Preview aus original (schneller)
    error.value = ''

    uploading.value = true
    try {
      const res = await upload(webpFile.name, webpFile, {
        access: 'public',
        handleUploadUrl: props.handleUploadUrl,
        multipart: true,
        ...(csrfHeader.value ? { headers: { 'x-csrf-token': csrfHeader.value } } : {}),
      })
      emit('update:modelValue', res.url)
    } finally {
      uploading.value = false
      resetInput()
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Bild konnte nicht konvertiert/hochgeladen werden.'
    resetInput()
  }
}

function removeImage() {
  emit('update:modelValue', '')
  error.value = ''
  resetInput()
}

function resetInput() {
  preview.value = ''
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div v-if="modelValue || preview" class="relative">
      <img
        :src="modelValue || preview"
        alt="Sponsor-Logo"
        class="h-20 w-20 rounded-lg border border-black/10 object-cover bg-gray-100"
      />
      <button
        v-if="!uploading"
        type="button"
        class="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white transition hover:bg-red-600"
        @click="removeImage"
      >
        <Icon icon="ph:x" class="h-3 w-3" />
      </button>
      <div v-if="uploading" class="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30">
        <Icon icon="ph:spinner" class="h-5 w-5 animate-spin text-white" />
      </div>
    </div>
    
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

