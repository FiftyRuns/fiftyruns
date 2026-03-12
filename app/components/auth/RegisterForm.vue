<template>
  <div class="lg:sticky lg:top-6">
    <div class="rounded-2xl bg-white/90 shadow-xl ring-1 ring-black/5 backdrop-blur">
      <div class="p-6 sm:p-8">

        <!-- Erfolgsmeldung -->
        <div v-if="registered" class="flex flex-col items-center gap-4 py-6 text-center">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
            <Icon icon="ph:check-circle-duotone" class="h-9 w-9 text-[var(--color-primary)]" />
          </div>
          <h2 class="text-xl font-semibold text-black">Registrierung erfolgreich!</h2>
          <p class="text-sm text-gray-600">Bitte prüfe deine E-Mails und bestätige dein Konto, um dich einzuloggen.</p>
          <NuxtLink
            to="/login"
            class="mt-2 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition"
          >
            Zum Login
          </NuxtLink>
        </div>

        <div v-else>
        <div class="mb-6 text-center">
          <h1 class="text-2xl  font-semibold tracking-tight" :style="{ color: 'var(--color-primary)' }">
            Konto erstellen
          </h1>
          <p class="mt-2 text-sm text-gray-600">Registriere dich, um 50runs zu nutzen.</p>
        </div>

        <form @submit.prevent="onSubmit" novalidate>
          <div class="space-y-5">
            <ProfileImagePicker
              v-model="form.profilePicture"
              :max-size="MAX_PROFILE_IMAGE_SIZE"
              :auto-upload="false"
              @update:model-value="onFileSelected"
              @error="(m) => (errors.profilePicture = m)"
            />

              <InputField id="name" v-model.trim="form.name" label="Benutzername" autocomplete="username"
                inputmode="text" maxlength="32" :error="errors.name"
                hint='Nur Kleinbuchstaben, Zahlen und Bindestriche. Beispiel: "max-mustermann"'
                @blur="syncNameIdFromName" />

              <InputField id="email" v-model.trim="form.email" label="E-Mail" type="email" inputmode="email"
                autocomplete="email" maxlength="100" :error="errors.email" />

              <InputField id="password" v-model="form.password" :type="showPassword ? 'text' : 'password'"
                label="Passwort" autocomplete="new-password" minlength="8" maxlength="72" :error="errors.password"
                hint="Mind. 8 Zeichen, Groß-/Kleinbuchstaben, Zahl und Sonderzeichen.">
                <template #trailing>
                  <button type="button" @click="togglePasswordVisibility"
                    class="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-900 focus:outline-none"
                    :aria-label="showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'">
                    <Icon :icon="showPassword ? 'ph:eye-slash' : 'ph:eye'" class="h-5 w-5" />
                  </button>
                </template>
              </InputField>

              <InputField id="passwordConfirm" v-model="form.passwordConfirm" :type="showPasswordConfirm ? 'text' : 'password'"
                label="Passwort wiederholen" autocomplete="new-password" minlength="8" maxlength="72"
                :error="errors.passwordConfirm">
                <template #trailing>
                  <button type="button" @click="showPasswordConfirm = !showPasswordConfirm"
                    class="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-900 focus:outline-none"
                    :aria-label="showPasswordConfirm ? 'Passwort verbergen' : 'Passwort anzeigen'">
                    <Icon :icon="showPasswordConfirm ? 'ph:eye-slash' : 'ph:eye'" class="h-5 w-5" />
                  </button>
                </template>
              </InputField>

              <CheckboxField id="tos" v-model="form.accept" :error="errors.accept"
                error-class="-mt-2 text-xs text-red-600">
                Ich akzeptiere die Nutzungsbedingungen und Datenschutzbestimmungen.
              </CheckboxField>
          </div>

          <div class="mt-6">
            <FormButton type="submit" variant="primary" :loading="pending" loading-label="Wird erstellt…"
              label="Registrieren" block />
          </div>

          <p class="mt-6 text-center text-sm" :style="{ color: 'var(--color-accent)' }">
            Bereits ein Konto?
            <NuxtLink to="/login" class="underline">Zum Login</NuxtLink>
          </p>
        </form>
        </div>
      </div>
    </div>
  </div>

  <!-- Crop-Modal -->
  <Teleport to="body">
    <div
      v-if="cropPhotoUrl"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      @click.self="cancelCrop"
    >
      <div class="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <h3 class="mb-3 text-base font-semibold text-gray-800">Bild zuschneiden</h3>

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

        <div class="mt-3 flex items-center gap-3 px-1">
          <svg class="h-4 w-4 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

        <div class="mt-4 flex justify-end gap-3">
          <button type="button" class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" @click="cancelCrop">Abbrechen</button>
          <button type="button" class="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90" @click="confirmCrop">Übernehmen</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onBeforeUnmount } from 'vue'
import { upload } from '@vercel/blob/client'
import { Icon } from '@iconify/vue'
import { useToast } from '../../composables/useToast'
import FormButton from '../atoms/form/FormButton.vue'
import CheckboxField from '../molecules/form/CheckboxField.vue'
import InputField from '../molecules/form/InputField.vue'
import ProfileImagePicker from '../molecules/form/ProfileImagePicker.vue'

const MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024 // 2 MB

const form = reactive({
  name: '',
  nameId: '',
  email: '',
  password: '',
  passwordConfirm: '',
  accept: false,
  profilePicture: null as File | null,
  avatarUrl: null as string | null, 
})

const { showSuccess, showError } = useToast()

const errors = reactive<Record<string, string | undefined>>({})
const serverError = ref('')
const serverSuccess = ref('')
const pending = ref(false)
const registered = ref(false)
const showPassword = ref(false)
const showPasswordConfirm = ref(false)
const csrfToken = ref('')

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// ── Crop-Editor ───────────────────────────────────────────────────────────────

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
const uploading = ref(false)

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

async function onFileSelected(file: File | null) {
  if (!file) return
  if (cropPhotoUrl.value) URL.revokeObjectURL(cropPhotoUrl.value)
  try {
    const webpFile = await convertToWebP(file)
    cropPhotoUrl.value = URL.createObjectURL(webpFile)
  } catch {
    cropPhotoUrl.value = URL.createObjectURL(file)
  }
}

function closeCropModal() {
  if (cropPhotoUrl.value) URL.revokeObjectURL(cropPhotoUrl.value)
  cropPhotoUrl.value = null
  cropOffsetX.value = 0
  cropOffsetY.value = 0
  zoomFactor.value = 1
}

function cancelCrop() {
  closeCropModal()
  form.profilePicture = null
}

async function confirmCrop() {
  const croppedFile = await cropToFile()
  if (croppedFile.size > MAX_PROFILE_IMAGE_SIZE) {
    errors.profilePicture = 'Bild darf höchstens 2 MB groß sein.'
    closeCropModal()
    return
  }
  closeCropModal()
  form.profilePicture = croppedFile
  errors.profilePicture = undefined

  // Upload sofort
  try {
    uploading.value = true
    const res = await upload(croppedFile.name, croppedFile, {
      access: 'public',
      handleUploadUrl: '/api/blob.upload',
      multipart: true,
      ...(csrfToken.value ? { headers: { 'x-csrf-token': csrfToken.value } } : {}),
    })
    form.avatarUrl = res.url
  } catch {
    errors.profilePicture = 'Upload fehlgeschlagen.'
  } finally {
    uploading.value = false
  }
}

const sanitizeBasic = (input: string) =>
  input.replace(/<[^>]*>/g, '').replace(/[\u0000-\u001f\u007f]/g, '').trim()

const slugify = (value: string) =>
  sanitizeBasic(value)
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9\-\s_]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/\-+/g, '-')
    .replace(/^-|-$/g, '')

const syncNameIdFromName = () => {
  if (!form.nameId) {
    form.nameId = slugify(form.name).slice(0, 32)
  }
}

const validate = () => {
  errors.name = undefined
  errors.nameId = undefined
  errors.email = undefined
  errors.password = undefined
  errors.passwordConfirm = undefined
  errors.accept = undefined

  const name = slugify(form.name)
  if (!name || !/^[a-z0-9](?:[a-z0-9-]{1,30})[a-z0-9]$/.test(name)) {
    errors.name = 'Benutzername: 2–32 Zeichen, nur a–z, 0–9, Bindestrich (nicht am Rand).'
  }

  const email = sanitizeBasic(form.email)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.email = 'Bitte eine gültige E-Mail angeben.'
  }

  const pwd = form.password
  const hasLen = pwd.length >= 8
  const hasUpper = /[A-Z]/.test(pwd)
  const hasLower = /[a-z]/.test(pwd)
  const hasDigit = /\d/.test(pwd)
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd)

  if (!(hasLen && hasUpper && hasLower && hasDigit && hasSpecial)) {
    errors.password =
      'Passwort muss mindestens 8 Zeichen enthalten und Großbuchstaben, Kleinbuchstaben, Zahl sowie Sonderzeichen beinhalten.'
  }

  if (!form.passwordConfirm) {
    errors.passwordConfirm = 'Bitte das Passwort erneut eingeben.'
  } else if (form.password !== form.passwordConfirm) {
    errors.passwordConfirm = 'Passwörter stimmen nicht überein.'
  }

  if (!form.accept) {
    errors.accept = 'Bitte Bedingungen akzeptieren.'
  }

  return Object.values(errors).every((entry) => !entry)
}

const fetchCsrf = async () => {
  const { token } = await $fetch<{ token: string }>('/api/security/csrf', { method: 'GET' })
  csrfToken.value = token
}

if (process.client) {
  fetchCsrf()
}

const onSubmit = async () => {
  serverError.value = ''
  serverSuccess.value = ''

  if (!validate()) {
    return
  }

  pending.value = true
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'x-csrf-token': csrfToken.value },
      body: {
        name: form.name,
        nameId: form.nameId,
        email: form.email,
        password: form.password,
        avatarUrl: form.avatarUrl,
      },
    })
    registered.value = true
  } catch (error: any) {
    showError(error?.data?.message || 'Registrierung fehlgeschlagen.')
  } finally {
    pending.value = false
  }
}

</script>
