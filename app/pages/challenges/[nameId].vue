<template>
  <div class="px-4 py-24">
    <div v-if="pending" class="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div class="h-64 animate-pulse rounded-3xl border border-black/5 bg-white/70"></div>
      <div class="h-32 animate-pulse rounded-3xl border border-black/5 bg-white/60"></div>
      <div class="grid gap-4 sm:grid-cols-2">
        <div v-for="n in 4" :key="n" class="h-40 animate-pulse rounded-3xl border border-black/5 bg-white/70"></div>
      </div>
    </div>

    <div v-else-if="errorMessage" class="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </div>

    <div v-else-if="challenge" class="mx-auto flex w-full max-w-5xl flex-col gap-10">
      <section class="rounded-3xl border border-black/5 bg-white/90 p-8 shadow-sm backdrop-blur">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div class="flex-1 space-y-4">
            <div class="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-gray-500">
              <span class="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-[var(--color-primary)]">
                <Icon icon="ph:calendar-duotone" class="h-4 w-4" />
                {{ challenge.period }}
              </span>
              <span v-if="challenge.visibility !== 'public'" class="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-gray-600">
                <Icon icon="ph:lock-duotone" class="h-4 w-4" />
                {{ visibilityLabel }}
              </span>
            </div>

            <h1 class="text-3xl font-bold text-gray-900">
              {{ challenge.name }}
            </h1>
            <p class="text-sm text-gray-600">{{ challenge.description || 'Keine Beschreibung verfügbar.' }}</p>

            <div class="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span class="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-[var(--color-primary)]">
                <Icon icon="ph:target-duotone" class="h-5 w-5" /> {{ challenge.goalLabel }}
              </span>
              <span v-if="challenge.minRequirements" class="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)]/10 px-3 py-1">
                <Icon icon="ph:check-circle-duotone" class="h-5 w-5 text-[var(--color-primary)]" />
                {{ challenge.minRequirements }}
              </span>
              <span class="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)]/10 px-3 py-1">
                <Icon icon="ph:user-circle-duotone" class="h-5 w-5 text-[var(--color-primary)]" />
                Admin: <NuxtLink :to="`/profile/${challenge.admin.nameId}`" class="font-semibold hover:text-[var(--color-primary)]">{{ challenge.admin.name }}</NuxtLink>
              </span>
              <span v-if="challenge.prize" class="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-[var(--color-primary)]">
                <Icon icon="ph:trophy-duotone" class="h-5 w-5" />
                {{ challenge.prize }}
              </span>
            </div>

            <div v-if="challenge.team" class="rounded-2xl border border-black/5 bg-white/80 px-4 py-3 text-sm text-gray-600">
              <span class="flex items-center gap-2">
                <Icon icon="ph:users-three-duotone" class="h-5 w-5 text-[var(--color-primary)]" />
                Challenge-Team: <NuxtLink :to="`/team/${challenge.team.nameId}`" class="font-semibold hover:text-[var(--color-primary)]">{{ challenge.team.name }}</NuxtLink>
              </span>
            </div>

            <div v-if="challenge.sponsorLogos?.length" class="flex flex-wrap items-center gap-3">
              <span class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Sponsoren</span>
              <div class="flex flex-wrap items-center gap-4">
                <NuxtImg
                  v-for="(logo, index) in challenge.sponsorLogos"
                  :key="index"
                  :src="logo"
                  :alt="`Sponsor Logo ${index + 1}`"
                  width="96"
                  height="48"
                  class="h-10 max-w-[120px] object-contain"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          <div class="flex w-full flex-col gap-4 rounded-2xl border border-black/10 bg-white/70 p-5 shadow-sm lg:max-w-sm">
            <div class="space-y-2">
              <p class="text-sm font-semibold text-gray-700">Status</p>
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <Icon icon="ph:calendar-check-duotone" class="h-5 w-5 text-[var(--color-primary)]" />
                {{ statusLabel }}
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <Icon icon="ph:users-three-duotone" class="h-5 w-5 text-[var(--color-primary)]" />
                {{ leaderboard.length }} Teilnehmende im Highscore
              </div>
            </div>

            <button
              v-if="isLoggedIn && !viewer.isAdmin"
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              :class="viewer.isMember ? 'bg-red-500 hover:bg-red-600 focus-visible:outline-red-500' : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 focus-visible:outline-[var(--color-primary)]'"
              :disabled="actionPending"
              @click="viewer.isMember ? leaveChallenge() : joinChallenge()"
            >
              <Icon :icon="viewer.isMember ? 'ph:sign-out-duotone' : 'ph:sign-in-duotone'" class="h-5 w-5" aria-hidden="true" />
              <span>{{ actionPending ? 'Wird verarbeitet…' : viewer.isMember ? 'Challenge verlassen' : 'Challenge beitreten' }}</span>
            </button>

            <NuxtLink
              v-if="viewer.isAdmin"
              :to="editPath"
              class="inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
              >
              <Icon icon="ph:pencil-simple-line-duotone" class="h-5 w-5" aria-hidden="true" />
                Challenge bearbeiten
            </NuxtLink>

            <p v-if="actionError" class="text-xs font-medium text-red-600">{{ actionError }}</p>
          </div>
        </div>
      </section>

      <section class="space-y-6">
        <header class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">Leaderboard</h2>
          <span class="text-xs text-gray-500">Top 25 Teilnehmende</span>
        </header>
        <div v-if="!leaderboard.length" class="rounded-3xl border border-dashed border-black/10 bg-white/80 p-8 text-center text-sm text-gray-500">
          Noch keine Aktivitäten. Sei die erste Person, die Fortschritt beiträgt!
        </div>
        <ul v-else class="grid gap-4">
          <li
            v-for="(entry, index) in leaderboard"
            :key="entry.user.id"
            class="flex flex-col gap-3 rounded-3xl border border-black/5 bg-white/90 p-5 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="flex items-center gap-4">
              <span class="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-accent)]/10 text-sm font-semibold text-black">
                {{ index + 1 }}
              </span>
              <NuxtLink :to="`/profile/${entry.user.nameId}`" class="flex items-center gap-3">
                <span class="h-7 w-7 overflow-hidden rounded-full border border-black/10 bg-gray-100">
                  <NuxtImg
                    v-if="entry.user.image"
                    :src="entry.user.image"
                    :alt="entry.user.name"
                    class="h-full w-full object-cover"
                    width="48"
                    height="48"
                    loading="lazy"
                  />
                  <span v-else class="grid h-full w-full place-items-center text-sm font-semibold uppercase text-[var(--color-primary)]">
                    {{ initials(entry.user.name) }}
                  </span>
                </span>
                <span class="text-sm font-semibold text-gray-900">{{ entry.user.name }}</span>
              </NuxtLink>
            </div>

            <div class="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
                  <Icon icon="ph:list-checks-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
                  {{ entry.runs }} Läufe
                </span>
                <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
                  <Icon icon="ph:road-horizon-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
                  {{ formatDistance(entry.distanceInMeters) }}
                </span>
                <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
                  <Icon icon="ph:timer-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
                  {{ formatDuration(entry.durationInSeconds) }}
                </span>
              </div>

              <div class="flex items-center gap-3">
                <div class="h-2 w-40 rounded-full bg-gray-200">
                  <div class="h-2 rounded-full bg-[var(--color-accent)]" :style="{ width: `${entry.progressPercent}%` }"></div>
                </div>
                <span class="text-xs font-semibold text-gray-700">{{ entry.progressPercent }}%</span>
              </div>
            </div>
          </li>
        </ul>
      </section>

      <section class="space-y-4">
        <header class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">Teilnehmende</h2>
          <span class="text-xs text-gray-500">Top 50 angezeigt</span>
        </header>
        <div v-if="!participants.length" class="rounded-3xl border border-dashed border-black/10 bg-white/80 p-8 text-center text-sm text-gray-500">
          Noch keine Teilnehmenden.
        </div>
        <ul v-else class="grid gap-3 sm:grid-cols-2">
          <li
            v-for="participant in participants"
            :key="participant.user.id"
            class="flex items-center gap-3 rounded-2xl border border-black/5 bg-white/90 px-4 py-3"
          >
            <NuxtLink :to="`/profile/${participant.user.nameId}`" class="flex items-center gap-3">
              <span class="h-10 w-10 overflow-hidden rounded-full border border-black/10 bg-gray-100">
                <NuxtImg
                  v-if="participant.user.image"
                  :src="participant.user.image"
                  :alt="participant.user.name"
                  class="h-full w-full object-cover"
                  width="40"
                  height="40"
                  loading="lazy"
                />
                <span v-else class="grid h-full w-full place-items-center text-sm font-semibold uppercase text-[var(--color-primary)]">
                  {{ initials(participant.user.name) }}
                </span>
              </span>
              <div>
                <p class="text-sm font-semibold text-gray-900">{{ participant.user.name }}</p>
                <p class="text-xs text-gray-500">Seit {{ formatShortDate(participant.joinedAt) }}</p>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useRoute } from 'vue-router'
import { useCookie } from 'nuxt/app'
import { useAuthUser } from '@/composables/useAuthUser'
import { useAsyncData } from 'nuxt/app'
import { useRouter } from 'vue-router'
import type { ComputedRefSymbol } from '@vue/reactivity'

interface ChallengeDetailResponse {
  challenge: {
    id: string
    name: string
    description: string
    prize: string
    image: string | null
    period: string
    startAt: string
    endAt: string
    goalType: string
    goalLabel: string
    minRequirements: string
    goalDistanceMeters: number | null
    goalDurationSeconds: number | null
    goalRuns: number | null
    minDistanceMeters: number | null
    minDurationSeconds: number | null
    visibility: string
    sponsorLogos: string[]
    admin: { id: string; name: string; nameId: string; image: string | null }
    team: { id: string; name: string; nameId: string } | null
  }
  viewer: {
    isAdmin: boolean
    isMember: boolean
  }
  leaderboard: Array<{
    user: { id: string; name: string; nameId: string; image: string | null }
    runs: number
    distanceInMeters: number
    durationInSeconds: number
    progressPercent: number
  }>
  participants: Array<{
    user: { id: string; name: string; nameId: string; image: string | null }
    joinedAt: string
  }>
}

const route = useRoute()
const csrf = useCookie('csrf_token')
const authUser = useAuthUser()

const actionPending = ref(false)
const actionError = ref('')

const slug = computed(() => String(route.params.nameId))
const editPath = computed(() => `/challenges/edit/${slug.value}`)

const { data, pending, error, refresh } = await useAsyncData(
  () => `challenge-detail-${slug.value}`,
  () =>
    $fetch<ChallengeDetailResponse>(`/api/challenges/${slug.value}`, {
      credentials: 'include',
    }),
  { watch: [slug] },
)

const challenge = computed(() => data.value?.challenge ?? null)
const viewer = computed(() => data.value?.viewer ?? { isAdmin: false, isMember: false })
const leaderboard = computed(() => data.value?.leaderboard ?? [])
const participants = computed(() => data.value?.participants ?? [])

const errorMessage = computed(() => (error.value ? 'Challenge konnte nicht geladen werden.' : ''))
const isLoggedIn = computed(() => Boolean(authUser.value))

const visibilityLabel = computed(() => {
  switch (challenge.value?.visibility) {
    case 'private':
      return 'Privat'
    case 'protected':
      return 'Nur Community'
    default:
      return 'Öffentlich'
  }
})

const statusLabel = computed(() => {
  if (!challenge.value) return ''
  const now = Date.now()
  const start = new Date(challenge.value.startAt).getTime()
  const end = new Date(challenge.value.endAt).getTime()
  if (now < start) return 'Startet bald'
  if (now > end) return 'Beendet'
  return 'Läuft aktuell'
})

async function joinChallenge() {
  if (!challenge.value) return
  actionPending.value = true
  actionError.value = ''
  try {
    await $fetch(`/api/challenges/${slug.value}/join`, {
      method: 'POST',
      headers: { 'x-csrf-token': csrf.value ?? '' },
      credentials: 'include',
    })
    await refresh()
  } catch (err: any) {
    console.error(err)
    actionError.value = err?.data?.message || err?.message || 'Konnte Challenge nicht beitreten.'
  } finally {
    actionPending.value = false
  }
}

async function leaveChallenge() {
  if (!challenge.value) return
  actionPending.value = true
  actionError.value = ''
  try {
    await $fetch(`/api/challenges/${slug.value}/leave`, {
      method: 'POST',
      headers: { 'x-csrf-token': csrf.value ?? '' },
      credentials: 'include',
    })
    await refresh()
  } catch (err: any) {
    console.error(err)
    actionError.value = err?.data?.message || err?.message || 'Konnte Challenge nicht verlassen.'
  } finally {
    actionPending.value = false
  }
}

function formatDistance(meters: number) {
  if (!meters) return '0 km'
  return `${(meters / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} km`
}

function formatDuration(seconds: number) {
  if (!seconds) return '0h'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (!h) return `${m} min`
  return `${h} h ${m} min`
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(value))
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

const navigateToEdit = () => {
  console.log('=== NAVIGATION DEBUG ===')
  console.log('slug:', slug.value)
  console.log('editPath:', editPath.value)
  console.log('viewer.isAdmin:', viewer.value.isAdmin)
  console.log('route.params:', route.params)
  
  // Teste ob die Route existiert
  const router = useRouter()
  const routeExists = router.resolve(editPath.value)
  console.log('Route exists:', routeExists)
  
  // Navigiere manuell
  router.push(editPath.value)
}

</script>
