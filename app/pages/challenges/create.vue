<template>
  <div class="px-4 py-24">
    <div class="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <header class="space-y-2">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">Challenge erstellen</p>
        <h1 class="text-3xl  font-semibold text-black">Starte eine neue Challenge</h1>
        <p class="text-sm text-gray-600">Definiere Ziele, Zeitrahmen und Regeln. Teilnehmende zählen automatisch ihre Läufe dazu.</p>
      </header>

      <form class="space-y-10" @submit.prevent="handleSubmit">
        <section class="rounded-3xl border border-black/5 bg-white/90 p-8 shadow-sm backdrop-blur">
          <h2 class="text-lg font-semibold text-black">Grunddaten</h2>
          <p class="text-sm text-gray-500">Name, Beschreibung und Zeitraum deiner Challenge.</p>

          <div class="mt-6 space-y-5">
            <div class="grid gap-5 sm:grid-cols-2">
              <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Titel
                <input v-model="form.name" type="text" required class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" placeholder="Winter Charity Run" />
              </label>
              <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Zeitraum Start
                <input v-model="form.startAt" type="date" required class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" />
              </label>
              <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Zeitraum Ende
                <input v-model="form.endAt" type="date" required class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" />
              </label>
              <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Sichtbarkeit
                <select v-model="form.visibility" class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20">
                  <option value="public">Öffentlich</option>
                  <option value="protected">Community</option>
                  <option value="private">Privat (nur auf Einladung)</option>
                </select>
              </label>
            </div>

            <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
              Beschreibung
              <textarea v-model="form.description" rows="4" class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" placeholder="Was ist das Ziel? Wie funktioniert die Challenge?" />
            </label>

            <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
              Preis / Gewinn (optional)
              <input v-model="form.prize" type="text" class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" placeholder="z. B. Laufshirt" />
            </label>

            <ChallengeImagePicker
              v-model="form.imageFile"
              :image-url="form.image"
              :csrf-token="csrf"
              label="Challenge-Titelbild (optional)"
              @uploaded="(url) => form.image = url"
            />
          </div>
        </section>

        <section class="rounded-3xl border border-black/5 bg-white/90 p-8 shadow-sm backdrop-blur">
          <h2 class="text-lg font-semibold text-black">Ziele definieren</h2>
          <p class="text-sm text-gray-500">Wähle die Zielart und setze ein messbares Ziel.</p>

          <div class="mt-6 space-y-5">
            <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
              Zieltyp
              <select v-model="form.goalType" class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20">
                <option value="RUNS">Anzahl Läufe</option>
                <option value="DISTANCE">Distanz (km)</option>
                <option value="TIME">Zeit (Stunden/Minuten)</option>
              </select>
            </label>

            <div v-if="form.goalType === 'RUNS'" class="grid gap-5 sm:grid-cols-2">
              <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Ziel-Läufe
                <input v-model.number="form.goalRuns" type="number" min="1" class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" />
              </label>
            </div>

            <div v-else-if="form.goalType === 'DISTANCE'" class="grid gap-5 sm:grid-cols-2">
              <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Gesamtdistanz (km)
                <input v-model.number="form.goalDistanceKm" type="number" min="1" step="0.5" class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" />
              </label>
            </div>

            <div v-else class="grid gap-5 sm:grid-cols-3">
              <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Stunden
                <input v-model.number="form.goalDurationHours" type="number" min="0" class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" />
              </label>
              <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Minuten
                <input v-model.number="form.goalDurationMinutes" type="number" min="0" max="59" class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" />
              </label>
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
              <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Mindestdistanz pro Lauf (km)
                <input v-model="form.minDistanceKm" type="number" min="0" step="0.5" class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" placeholder="z. B. 5" />
              </label>
              <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Mindestdauer pro Lauf (Minuten)
                <input v-model="form.minDurationMinutes" type="number" min="0" class="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" placeholder="z. B. 30" />
              </label>
            </div>
          </div>
        </section>

        <section class="rounded-3xl border border-black/5 bg-white/90 p-8 shadow-sm backdrop-blur">
          <h2 class="text-lg font-semibold text-black">Sponsoren & Team</h2>
          <p class="text-sm text-gray-500">Optional Logos hinterlegen oder die Challenge einem Team zuordnen.</p>

          <div class="mt-6 space-y-5">
            <div class="space-y-3">
              <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Sponsor Logos (optional)</p>
              <div class="flex flex-wrap gap-3">
                <SponsorLogoPicker
                  v-for="(logo, index) in form.sponsorLogos"
                  :key="index"
                  v-model="form.sponsorLogos[index]"
                  :csrf-token="csrf"
                  @update:model-value="form.sponsorLogos[index] = $event ?? ''"
                />
              </div>
              <button
                type="button"
                class="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-primary)]"
                @click="addLogo"
              >
                <Icon icon="ph:plus-circle-duotone" class="h-4 w-4" /> Sponsor hinzufügen
              </button>
            </div>

            <!-- Fixed: Proper null check and removed .value access -->
            <div v-if="teamInfo && teamInfo.roleLabel === 'Admin'" class="rounded-2xl border border-black/10 bg-white/70 p-4 text-sm text-gray-600">
              <label class="flex items-center gap-2">
                <input v-model="form.assignToTeam" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]/30" />
                <span>Challenge dem Team <strong>{{ teamInfo.name }}</strong> zuordnen</span>
              </label>
              <p class="mt-1 text-xs text-gray-500">Alle Teammitglieder tragen gemeinsam zum Ziel bei.</p>
            </div>
          </div>
        </section>

        <div class="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            class="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-[var(--color-primary)]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="submitting"
          >
            <Icon icon="ph:rocket-launch-duotone" class="h-5 w-5" aria-hidden="true" />
            <span>{{ submitting ? 'Challenge wird erstellt…' : 'Challenge erstellen' }}</span>
          </button>
          <NuxtLink to="/challenges" class="text-sm font-medium text-gray-600 hover:text-[var(--color-primary)]">
            Abbrechen
          </NuxtLink>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useCookie } from 'nuxt/app'
import { useRouter } from 'vue-router'
import { useAuthUser } from '@/composables/useAuthUser'
import { useAsyncData } from 'nuxt/app'
import { useToast } from '@/composables/useToast'
import ChallengeImagePicker from '@/components/molecules/form/ChallengeImagePicker.vue'
import SponsorLogoPicker from '@/components/molecules/form/SponsorLogoPicker.vue'

const router = useRouter()
const csrf = useCookie('csrf_token')
const authUser = useAuthUser()
const { showSuccess, showError } = useToast()
const submitting = ref(false)

const today = new Date()
const defaultStart = today.toISOString().slice(0, 10)
const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()).toISOString().slice(0, 10)

const form = reactive({
  name: '',
  description: '',
  prize: '',
  image: '',
  imageFile: null as File | null,
  startAt: defaultStart,
  endAt: defaultEnd,
  visibility: 'public',
  goalType: 'RUNS' as 'RUNS' | 'DISTANCE' | 'TIME',
  goalRuns: 50,
  goalDistanceKm: 200,
  goalDurationHours: 40,
  goalDurationMinutes: 0,
  minDistanceKm: '',
  minDurationMinutes: '',
  sponsorLogos: [''],
  assignToTeam: false,
})

const { data: teamInfo } = await useAsyncData('challenge-create-team', async () => {
  if (!authUser.value) return null
  try {
    const res = await $fetch<{
      team: {
        id: string
        name: string
        roleLabel: string | null
      } | null
    }>('/api/profile/overview', { credentials: 'include' })
    return res.team
  } catch (err) {
    if (process.dev) {
      console.error('[challenge-create] Team load failed', err)
    }
    return null
  }
}, { immediate: !!authUser.value })

const isLoggedIn = computed(() => Boolean(authUser.value))

if (!isLoggedIn.value) {
  router.replace('/login?redirect=/challenges/create')
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

  try {
    const payload = buildPayload()
    const response = await $fetch<{ nameId: string }>(
      '/api/challenges',
      {
        method: 'POST',
        headers: { 'x-csrf-token': csrf.value ?? '' },
        credentials: 'include',
        body: payload,
      },
    )
    showSuccess('Challenge erfolgreich erstellt!')
    await router.push(`/challenges/${response.nameId}`)
  } catch (err: any) {
    if (process.dev) {
      console.error('Challenge erstellen fehlgeschlagen', err)
    }
    showError(err?.data?.message || err?.message || 'Challenge konnte nicht erstellt werden.')
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

  const sponsorLogos = form.sponsorLogos
    .map((logo) => logo.trim())
    .filter((logo) => logo.length > 0)

  const payload: any = {
    name: form.name,
    description: form.description,
    prize: form.prize,
    image: form.image,
    startAt: form.startAt,
    endAt: form.endAt,
    goal,
    minDistanceMeters,
    minDurationSeconds,
    visibility: form.visibility,
    sponsorLogos,
  }

  // Fixed: Proper null check and removed .value access
  if (teamInfo && teamInfo.value?.roleLabel === 'Admin' && form.assignToTeam) {
    payload.teamId = teamInfo.value?.id
  }

  return payload
}
</script>
