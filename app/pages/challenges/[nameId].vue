<template>
  <div class="px-4 py-12">
    <ConfirmModal
      v-model="showDeleteConfirm"
      title="Challenge löschen?"
      message="Möchtest du diese Challenge wirklich dauerhaft löschen? Dieser Schritt kann nicht rückgängig gemacht werden."
      confirm-text="Challenge löschen"
      variant="danger"
      @confirm="handleDeleteConfirm"
    />
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

            <h1 class="text-3xl  font-semibold text-black">
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

            <div
              v-if="showTeamJoinHint"
              class="flex items-start gap-3 rounded-2xl border border-dashed border-[var(--color-primary)]/30 bg-white/80 px-4 py-3 text-sm text-gray-600"
            >
              <Icon icon="ph:lock-key-duotone" class="h-5 w-5 text-[var(--color-primary)]" />
              <span>
                Diese Challenge ist nur für Mitglieder des Teams
                <strong>{{ challenge.team?.name }}</strong> verfügbar. Tritt dem Team bei oder öffne die
                <NuxtLink :to="teamLink" class="font-semibold text-[var(--color-primary)] hover:underline">Teamübersicht</NuxtLink>
                , um teilzunehmen.
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

            <div v-if="challengeRunning" class="rounded-xl bg-[var(--color-primary)] px-4 py-3">
              <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-white/60">Endet in</p>
              <div class="flex items-end gap-3">
                <div v-for="unit in countdown" :key="unit.label" class="flex flex-col items-center">
                  <span class="tabular-nums text-2xl font-black text-white leading-none">{{ unit.value }}</span>
                  <span class="mt-0.5 text-[10px] font-semibold tracking-wider text-white/50 uppercase">{{ unit.label }}</span>
                </div>
              </div>
            </div>

            <button
              v-if="isLoggedIn && !viewer.isAdmin && (viewer.isMember || viewerCanJoin)"
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              :class="viewer.isMember ? 'bg-red-500 hover:bg-red-600 focus-visible:outline-red-500' : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 focus-visible:outline-[var(--color-primary)]'"
              :disabled="actionPending"
              @click="viewer.isMember ? leaveChallenge() : joinChallenge()"
            >
              <Icon :icon="viewer.isMember ? 'ph:sign-out-duotone' : 'ph:sign-in-duotone'" class="h-5 w-5" aria-hidden="true" />
              <span>{{ actionPending ? 'Wird verarbeitet…' : viewer.isMember ? 'Challenge verlassen' : 'Challenge beitreten' }}</span>
            </button>

            <div v-if="viewer.isAdmin" class="flex flex-col gap-2">
              <NuxtLink
                :to="editPath"
                class="inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                <Icon icon="ph:pencil-simple-line-duotone" class="h-5 w-5" aria-hidden="true" />
                Challenge bearbeiten
              </NuxtLink>
              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                :disabled="deletePending"
                @click="deleteChallenge"
              >
                <Icon icon="ph:trash-duotone" class="h-5 w-5" aria-hidden="true" />
                <span>{{ deletePending ? 'Wird gelöscht…' : 'Challenge löschen' }}</span>
              </button>
            </div>

            <p v-if="actionError" class="text-xs font-medium text-red-600">{{ actionError }}</p>
          </div>
        </div>
      </section>

      <section
        v-if="!isLoggedIn"
        class="relative overflow-hidden rounded-3xl bg-[var(--color-primary)] p-8 shadow-sm"
      >
        <div class="pointer-events-none absolute inset-0 opacity-10">
          <Icon icon="ph:trophy-duotone" class="absolute -right-8 -top-8 h-48 w-48 text-white" />
        </div>
        <div class="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div class="space-y-2">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Mach mit!</p>
            <h2 class="text-xl font-semibold text-white">Tritt dieser Challenge bei</h2>
            <p class="max-w-md text-sm text-white/70">
              Erstelle ein kostenloses Konto oder melde dich an, um an der Challenge teilzunehmen und im Leaderboard aufzusteigen.
            </p>
          </div>
          <div class="flex shrink-0 flex-col gap-3 sm:flex-row">
            <NuxtLink
              to="/register"
              class="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-primary)] shadow transition hover:bg-white/90"
            >
              <Icon icon="ph:user-plus-duotone" class="h-5 w-5" />
              Registrieren
            </NuxtLink>
            <NuxtLink
              to="/login"
              class="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <Icon icon="ph:sign-in-duotone" class="h-5 w-5" />
              Anmelden
            </NuxtLink>
          </div>
        </div>
      </section>

      <section class="space-y-6">
        <header class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-black">Leaderboard</h2>
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
              <span class="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-accent)]/10 text-sm font-semibold  text-black">
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
                <span class="text-sm font-semibold text-black">{{ entry.user.name }}</span>
              </NuxtLink>
            </div>

            <div class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          <h2 class="text-lg font-semibold text-black">Teilnehmende</h2>
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
                <p class="text-sm font-semibold text-black">{{ participant.user.name }}</p>
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
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { useRoute, useRouter } from 'vue-router'
import { useCookie } from 'nuxt/app'
import { useAuthUser } from '@/composables/useAuthUser'
import { useAsyncData } from 'nuxt/app'
import { useToast } from '@/composables/useToast'
import ConfirmModal from '@/components/molecules/ConfirmModal.vue'
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
    teamOnly: boolean
  }
  viewer: {
    isAdmin: boolean
    isMember: boolean
    belongsToTeam: boolean
    canJoin: boolean
    needsTeamMembership: boolean
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
const router = useRouter()
const csrf = useCookie('csrf_token')
const authUser = useAuthUser()
const { showSuccess, showError, showWarning } = useToast()

const actionPending = ref(false)
const actionError = ref('')
const deletePending = ref(false)
const showDeleteConfirm = ref(false)

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
const errorMessage = computed(() => {
  if (!pending.value && error.value && !data.value?.challenge) {
    if (process.dev) {
      console.error('[challenge-detail] Failed to load challenge', error.value)
    }
    return 'Challenge konnte nicht geladen werden. Bitte versuchen Sie es später erneut.'
  }
  return ''
})
const viewer = computed(
  () =>
    data.value?.viewer ?? {
      isAdmin: false,
      isMember: false,
      belongsToTeam: false,
      canJoin: true,
      needsTeamMembership: false,
    },
)
const leaderboard = computed(() => data.value?.leaderboard ?? [])
const participants = computed(() => data.value?.participants ?? [])

const requiresTeamMembership = computed(() => Boolean(challenge.value?.teamOnly))
const viewerCanJoin = computed(() => viewer.value.canJoin)
const showTeamJoinHint = computed(
  () => requiresTeamMembership.value && !viewer.value.isMember && !viewerCanJoin.value,
)
const teamLink = computed(() => (challenge.value?.team ? `/team/${challenge.value.team.nameId}` : '/team/discover'))

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

const challengeRunning = computed(() => {
  if (!challenge.value) return false
  const now = Date.now()
  return now >= new Date(challenge.value.startAt).getTime() && now < new Date(challenge.value.endAt).getTime()
})

function getTimeLeft() {
  if (!challenge.value) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  const diff = Math.max(0, new Date(challenge.value.endAt).getTime() - Date.now())
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}
const timeLeft = ref(getTimeLeft())
let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => { timer = setInterval(() => { timeLeft.value = getTimeLeft() }, 1000) })
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
const pad = (n: number) => String(n).padStart(2, '0')
const countdown = computed(() => [
  { label: 'Tage', value: String(timeLeft.value.days) },
  { label: 'Std', value: pad(timeLeft.value.hours) },
  { label: 'Min', value: pad(timeLeft.value.minutes) },
  { label: 'Sek', value: pad(timeLeft.value.seconds) },
])

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
  if (!viewerCanJoin.value && !viewer.value.isMember) {
    const teamName = challenge.value.team?.name ?? 'Team'
    actionError.value = `Diese Challenge ist nur für Mitglieder des Teams „${teamName}“. Bitte tritt dem Team bei.`
    return
  }
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
    if (process.dev) {
      console.error('[challenge-detail] Join failed', err)
    }
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
    const result = await $fetch<{ ok: boolean; deleted?: boolean }>(`/api/challenges/${slug.value}/leave`, {
      method: 'POST',
      headers: { 'x-csrf-token': csrf.value ?? '' },
      credentials: 'include',
    })
    if (result?.deleted) {
      await router.push('/challenges')
      return
    }
    await refresh()
  } catch (err: any) {
    if (process.dev) {
      console.error('[challenge-detail] Join failed', err)
    }
    actionError.value = err?.data?.message || err?.message || 'Konnte Challenge nicht verlassen.'
  } finally {
    actionPending.value = false
  }
}

function deleteChallenge() {
  showDeleteConfirm.value = true
}

async function handleDeleteConfirm() {
  if (!challenge.value || deletePending.value) return

  deletePending.value = true

  try {
    await $fetch(`/api/challenges/${slug.value}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': csrf.value ?? '' },
      credentials: 'include',
    })
    showSuccess('Challenge erfolgreich gelöscht')
    await router.push('/challenges')
  } catch (err: any) {
    if (process.dev) {
      console.error('[challenge-detail] Delete failed', err)
    }
    showError(err?.data?.message || err?.message || 'Challenge konnte nicht gelöscht werden.')
  } finally {
    deletePending.value = false
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
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
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
  if (process.dev) {
    console.log('=== NAVIGATION DEBUG ===')
    console.log('slug:', slug.value)
    console.log('editPath:', editPath.value)
    console.log('viewer.isAdmin:', viewer.value.isAdmin)
    console.log('route.params:', route.params)
    
    // Teste ob die Route existiert
    const router = useRouter()
    const routeExists = router.resolve(editPath.value)
    console.log('Route exists:', routeExists)
  }
  
  // Navigiere manuell
  router.push(editPath.value)
}

</script>
