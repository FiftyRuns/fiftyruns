<template>
  <div class="px-4 py-24">
    <div v-if="pending" class="mx-auto max-w-4xl space-y-6">
      <div class="h-48 animate-pulse rounded-3xl border border-black/5 bg-white/80"></div>
      <div class="h-32 animate-pulse rounded-3xl border border-black/5 bg-white/70"></div>
    </div>

    <div v-else-if="loadError"
      class="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ loadError }}
    </div>

    <div v-else class="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <header class="space-y-2">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
          Challenge bearbeiten
        </p>
        <h1 class="text-3xl font-semibold text-black">Passe deine Challenge an</h1>
        <p class="text-sm text-gray-600">
          Aktualisiere Inhalte, Ziele, Sponsorenlogos oder die Teamzuordnung. Änderungen wirken sich sofort auf
          Teilnehmer:innen aus.
        </p>
      </header>

      <form class="space-y-10" @submit.prevent="handleSubmit">
        <section class="rounded-3xl border border-black/5 bg-white/90 p-8 shadow-sm backdrop-blur">
          <h2 class="text-lg font-semibold text-black">Grunddaten</h2>
          <p class="text-sm text-gray-500">Passe Namen, Beschreibung, Zeitraum und Sichtbarkeit deiner Challenge an.</p>

          <div class="mt-6 space-y-5">
            <div class="grid gap-5 sm:grid-cols-2">
              <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Titel
                <input v-model="form.name" type="text" required
                  class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" />
              </label>
              <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Zeitraum Start
                <input v-model="form.startAt" type="date" required
                  class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" />
              </label>
              <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Zeitraum Ende
                <input v-model="form.endAt" type="date" required
                  class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" />
              </label>
              <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Sichtbarkeit
                <select v-model="form.visibility"
                  class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20">
                  <option value="public">Öffentlich</option>
                  <option value="protected">Community</option>
                  <option value="private">Privat (nur Einladung)</option>
                </select>
              </label>
            </div>

            <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
              Beschreibung
              <textarea v-model="form.description" rows="4"
                class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" />
            </label>

            <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
              Preis / Gewinn (optional)
              <input v-model="form.prize" type="text"
                class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" />
            </label>

            <ChallengeImagePicker
              v-model="form.imageFile"
              :image-url="form.image"
              :csrf-token="csrf"
              label="Challenge-Titelbild (optional)"
            />
          </div>
        </section>

        <section class="rounded-3xl border border-black/5 bg-white/90 p-8 shadow-sm backdrop-blur">
          <h2 class="text-lg font-semibold text-black">Ziele anpassen</h2>
          <p class="text-sm text-gray-500">Aktualisiere Zieltyp und Zielwerte – Teilnehmende sehen den Fortschritt
            sofort.</p>

          <div class="mt-6 space-y-5">
            <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
              Zieltyp
              <select v-model="form.goalType"
                class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20">
                <option value="RUNS">Anzahl Läufe</option>
                <option value="DISTANCE">Distanz (km)</option>
                <option value="TIME">Zeit (Stunden/Minuten)</option>
              </select>
            </label>

            <div v-if="form.goalType === 'RUNS'" class="grid gap-5 sm:grid-cols-2">
              <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Ziel-Läufe
                <input v-model.number="form.goalRuns" type="number" min="1"
                  class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" />
              </label>
            </div>

            <div v-else-if="form.goalType === 'DISTANCE'" class="grid gap-5 sm:grid-cols-2">
              <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Gesamtdistanz (km)
                <input v-model.number="form.goalDistanceKm" type="number" min="1" step="0.5"
                  class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" />
              </label>
            </div>

            <div v-else class="grid gap-5 sm:grid-cols-3">
              <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Stunden
                <input v-model.number="form.goalDurationHours" type="number" min="0"
                  class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" />
              </label>
              <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Minuten
                <input v-model.number="form.goalDurationMinutes" type="number" min="0" max="59"
                  class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" />
              </label>
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
              <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Mindestdistanz pro Lauf (km)
                <input v-model="form.minDistanceKm" type="number" min="0" step="0.5"
                  class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" />
              </label>
              <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Mindestdauer pro Lauf (Minuten)
                <input v-model="form.minDurationMinutes" type="number" min="0"
                  class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" />
              </label>
            </div>
          </div>
        </section>

        <section class="rounded-3xl border border-black/5 bg-white/90 p-8 shadow-sm backdrop-blur">
          <h2 class="text-lg font-semibold text-black">Sponsoren & Team</h2>
          <p class="text-sm text-gray-500">Logos aktualisieren oder Teamzuordnung anpassen.</p>

          <div class="mt-6 space-y-5">
            <div class="space-y-3">
              <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Sponsor Logos</p>
              <div class="flex flex-wrap gap-3">
                <SponsorLogoPicker
                  v-for="(logo, index) in form.sponsorLogos"
                  :key="index"
                  v-model="form.sponsorLogos[index]"
                  :csrf-token="csrf"
                  @update:model-value="form.sponsorLogos[index] = $event ?? ''"
                />
              </div>
              <button type="button"
                class="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-primary)]"
                @click="addLogo">
                <Icon icon="ph:plus-circle-duotone" class="h-4 w-4" />
                Sponsor hinzufügen
              </button>
            </div>

            <div v-if="teamInfo && teamInfo.roleLabel === 'Admin'"
              class="rounded-2xl border border-black/10 bg-white/70 p-4 text-sm text-gray-600">
              <label class="flex items-center gap-3">
                <input v-model="form.assignToTeam" type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]/30" />
                <span>
                  Challenge dem Team <strong>{{ teamInfo.name }}</strong>
                  {{ form.assignToTeam ? 'zugeordnet' : 'nicht zugeordnet' }}
                </span>
              </label>
              <p class="mt-1 text-xs text-gray-500">
                Wenn aktiviert, tragen alle Teammitglieder gemeinsam zum Ziel bei.
              </p>
            </div>
          </div>
        </section>

        <div class="flex flex-wrap items-center gap-4">
          <button type="submit"
            class="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-[var(--color-primary)]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="submitting">
            <Icon icon="ph:floppy-disk-duotone" class="h-5 w-5" aria-hidden="true" />
            <span>{{ submitting ? 'Änderungen werden gespeichert…' : 'Änderungen speichern' }}</span>
          </button>
          <NuxtLink :to="`/challenges/${slug}`"
            class="text-sm font-medium text-gray-600 hover:text-[var(--color-primary)]">
            Abbrechen
          </NuxtLink>
        </div>

        <p v-if="errorMessage" class="text-sm font-medium text-red-600">{{ errorMessage }}</p>
        <p v-if="successMessage" class="text-sm font-medium text-green-600">{{ successMessage }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useRoute, useRouter } from 'vue-router'
import { useCookie } from 'nuxt/app'
import { useAuthUser } from '@/composables/useAuthUser'
import { useAsyncData } from 'nuxt/app'
import ChallengeImagePicker from '@/components/molecules/form/ChallengeImagePicker.vue'
import SponsorLogoPicker from '@/components/molecules/form/SponsorLogoPicker.vue'

interface ChallengeDetailResponse {
  challenge: {
    id: string
    name: string
    description: string
    prize: string
    image: string | null
    startAt: string
    endAt: string
    visibility: 'public' | 'protected' | 'private'
    goalType: 'RUNS' | 'DISTANCE' | 'TIME'
    goalDistanceMeters: number | null
    goalDurationSeconds: number | null
    goalRuns: number | null
    minDistanceMeters: number | null
    minDurationSeconds: number | null
    sponsorLogos: string[]
    team: { id: string; name: string; nameId: string } | null
  }
  viewer: {
    isAdmin: boolean
  }
}

const route = useRoute()
const router = useRouter()
const slug = computed(() => String(route.params.nameId))
const csrf = useCookie('csrf_token')
const authUser = useAuthUser()

const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const loadError = ref('')
const initialTeamId = ref<string | null>(null)

const form = reactive({
  name: '',
  description: '',
  prize: '',
  image: '',
  imageFile: null as File | null,
  startAt: '',
  endAt: '',
  visibility: 'public' as 'public' | 'protected' | 'private',
  goalType: 'RUNS' as 'RUNS' | 'DISTANCE' | 'TIME',
  goalRuns: 0,
  goalDistanceKm: 0,
  goalDurationHours: 0,
  goalDurationMinutes: 0,
  minDistanceKm: '',
  minDurationMinutes: '',
  sponsorLogos: [''] as string[],
  assignToTeam: false,
})

const { data, pending, error, refresh } = await useAsyncData(
  () => `challenge-edit-${slug.value}`,
  () =>
    $fetch<ChallengeDetailResponse>(`/api/challenges/${slug.value}`, {
      credentials: 'include',
    }),
  { watch: [slug] },
)

const { data: teamInfo } = await useAsyncData('challenge-edit-team', async () => {
  if (!authUser.value) return null
  try {
    const res = await $fetch<{ team: { id: string; name: string; roleLabel: string | null } | null }>(
      '/api/profile/overview',
      { credentials: 'include' },
    )
    return res.team
  } catch (err) {
    if (process.dev) {
      console.error('[challenge-edit] Team load failed', err)
    }
    return null
  }
}, { immediate: !!authUser.value })

watch(
  data,
  (payload) => {
    if (!payload?.challenge) return
    if (!payload.viewer?.isAdmin) {
      router.replace(`/challenges/${slug.value}`)
      return
    }
    applyChallenge(payload.challenge)
  },
  { immediate: true },
)

watch(error, (err) => {
  loadError.value = err ? 'Challenge konnte nicht geladen werden.' : ''
})

function applyChallenge(challenge: ChallengeDetailResponse['challenge']) {
  form.name = challenge.name
  form.description = challenge.description
  form.prize = challenge.prize
  form.image = challenge.image ?? ''
  form.startAt = challenge.startAt.slice(0, 10)
  form.endAt = challenge.endAt.slice(0, 10)
  form.visibility = challenge.visibility

  form.goalType = challenge.goalType
  if (challenge.goalType === 'RUNS') {
    form.goalRuns = challenge.goalRuns ?? 0
    form.goalDistanceKm = 0
    form.goalDurationHours = 0
    form.goalDurationMinutes = 0
  } else if (challenge.goalType === 'DISTANCE') {
    form.goalDistanceKm = challenge.goalDistanceMeters ? challenge.goalDistanceMeters / 1000 : 0
  } else {
    const seconds = challenge.goalDurationSeconds ?? 0
    form.goalDurationHours = Math.floor(seconds / 3600)
    form.goalDurationMinutes = Math.floor((seconds % 3600) / 60)
  }

  form.minDistanceKm = challenge.minDistanceMeters ? String(challenge.minDistanceMeters / 1000) : ''
  form.minDurationMinutes = challenge.minDurationSeconds ? String(Math.floor(challenge.minDurationSeconds / 60)) : ''

  form.sponsorLogos = challenge.sponsorLogos?.length ? [...challenge.sponsorLogos] : ['']

  initialTeamId.value = challenge.team?.id ?? null
  form.assignToTeam = Boolean(initialTeamId.value)
}

function addLogo() {
  if (form.sponsorLogos.length >= 8) return
  form.sponsorLogos.push('')
}

function removeLogo(index: number) {
  form.sponsorLogos.splice(index, 1)
  if (!form.sponsorLogos.length) form.sponsorLogos.push('')
}

async function handleSubmit() {
  if (submitting.value) return
  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const payload = buildPayload()
    await $fetch(`/api/challenges/${slug.value}`, {
      method: 'PATCH',
      headers: { 'x-csrf-token': csrf.value ?? '' },
      credentials: 'include',
      body: payload,
    })
    successMessage.value = 'Challenge aktualisiert.'
    await refresh()
    await router.push(`/challenges/${slug.value}`)
  } catch (err: any) {
    if (process.dev) {
      console.error('[challenge-edit] Challenge aktualisieren fehlgeschlagen', err)
    }
    errorMessage.value = err?.data?.message || err?.message || 'Challenge konnte nicht aktualisiert werden.'
  } finally {
    submitting.value = false
  }
}

function buildPayload() {
  const goal: Record<string, unknown> = { type: form.goalType }
  if (form.goalType === 'RUNS') {
    goal.runs = Number(form.goalRuns)
  } else if (form.goalType === 'DISTANCE') {
    goal.distanceMeters = Math.round(Math.max(0, Number(form.goalDistanceKm)) * 1000)
  } else {
    const hours = Number(form.goalDurationHours) || 0
    const minutes = Number(form.goalDurationMinutes) || 0
    goal.durationSeconds = Math.max(0, hours * 3600 + minutes * 60)
  }

  const minDistanceMeters = form.minDistanceKm ? Math.round(Number(form.minDistanceKm) * 1000) : null
  const minDurationSeconds = form.minDurationMinutes ? Math.round(Number(form.minDurationMinutes) * 60) : null

  const sponsorLogos = form.sponsorLogos.map((logo) => logo.trim()).filter((logo) => logo.length > 0)

  const payload: Record<string, unknown> = {
    name: form.name,
    description: form.description,
    prize: form.prize,
    image: form.image,
    startAt: form.startAt,
    endAt: form.endAt,
    visibility: form.visibility,
    goal,
    minDistanceMeters,
    minDurationSeconds,
    sponsorLogos,
  }

  if (teamInfo.value && teamInfo.value.roleLabel === 'Admin') {
    if (form.assignToTeam) {
      payload.teamId = teamInfo.value.id
    } else if (initialTeamId.value) {
      payload.teamId = null
    }
  }

  return payload
}
</script>
