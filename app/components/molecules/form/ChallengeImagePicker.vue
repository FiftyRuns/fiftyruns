<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue'
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

function resetInput() {
  preview.value = ''
  if (fileInput.value) fileInput.value.value = ''
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
          access: 'public',
          handleUploadUrl: props.handleUploadUrl,
          multipart: true,
          ...(csrfHeader.value ? { headers: { 'x-csrf-token': csrfHeader.value } } : {}),
        })
        emit('uploaded', res.url)
        emit('update:imageUrl', res.url)
      } finally {
        uploading.value = false
      }
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Bild konnte nicht konvertiert/hochgeladen werden.')
    emit('update:modelValue', null)
    resetInput()
  }
}

function removeImage() {
  emit('update:modelValue', null)
  emit('update:imageUrl', null)
  setError(undefined)
  resetInput()
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <label v-if="label" class="text-sm font-medium text-gray-700">
      {{ label }}
    </label>
    
    <div v-if="preview || imageUrl" class="group relative">
      <img
        :src="preview || imageUrl || undefined"
        alt="Vorschau"
        class="h-48 w-full rounded-xl border border-black/10 object-cover bg-gray-100"
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

