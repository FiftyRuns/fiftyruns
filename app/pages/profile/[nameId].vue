<template>
  <div class="px-4 py-24">
    <div class="mx-auto flex w-full max-w-5xl flex-col gap-10">
      <div v-if="errorMessage" class="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <span>{{ errorMessage }}</span>
          <button type="button"
            class="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            @click="() => refresh()">
            <Icon icon="ph:arrow-clockwise-duotone" class="h-4 w-4" aria-hidden="true" />
            Erneut versuchen
          </button>
        </div>
      </div>

      <div v-else-if="pending" class="space-y-6">
        <div class="h-40 animate-pulse rounded-3xl border border-black/5 bg-white/70"></div>
        <div class="grid gap-4 sm:grid-cols-3">
          <div v-for="n in 3" :key="`stat-${n}`"
            class="h-32 animate-pulse rounded-3xl border border-black/5 bg-white/70"></div>
        </div>
        <div class="space-y-3">
          <div v-for="n in 3" :key="`post-${n}`"
            class="h-40 animate-pulse rounded-3xl border border-black/5 bg-white/70"></div>
        </div>
      </div>

      <template v-else-if="profile">
        <header class="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-4">
              <span class="relative h-20 w-20 overflow-hidden rounded-full border border-black/10 bg-gray-100">
                <NuxtImg v-if="profile.user.image" :src="profile.user.image"
                  :alt="`Profilbild von ${profile.user.name}`" class="h-full w-full object-cover" width="160"
                  height="160" loading="lazy" />
                <span v-else
                  class="grid h-full w-full place-items-center text-2xl font-semibold uppercase text-[var(--color-primary)]">
                  {{ initials(profile.user.name) }}
                </span>
              </span>
              <div>
                <h1 class="text-3xl  font-semibold text-black">{{ profile.user.name }}</h1>
                <p v-if="profile.user.bio" class="mt-2 max-w-xl text-sm text-gray-700">
                  {{ profile.user.bio }}
                </p>
                <p v-else class="mt-2 text-sm text-gray-500">
                  Noch keine Profilbeschreibung vorhanden.
                </p>
              </div>
            </div>

            <div class="flex flex-col items-start gap-2 sm:items-end">
              <span
                class="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
                Season {{ profile.stats.season }}
              </span>
              <p class="text-2xl font-semibold text-black">
                {{ formattedDonations }}
              </p>
              <p class="text-xs text-gray-500">Gespendet über Läufe insgesamt</p>
              <p v-if="profile.user.group" class="text-xs text-gray-500">
                Team: {{ profile.user.group.name }}
                <span v-if="profile.user.group.role" class="ml-1 text-gray-400">
                  ({{ translateRole(profile.user.group.role) }})
                </span>
              </p>
            </div>
          </div>
        </header>

        <!-- Updated section using ProfileStatCard -->
        <section aria-labelledby="profile-stats-title"
          class="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div class="flex items-center justify-between">
            <div>
              <h2 id="profile-stats-title" class="text-lg font-semibold text-black">Laufstatistiken</h2>
              <p class="mt-1 text-sm text-gray-600">
                Gesamtwerte der aktuellen Season.
              </p>
            </div>
            <Icon icon="ph:activity-duotone" class="h-6 w-6 text-[var(--color-primary)]" aria-hidden="true" />
          </div>

          <div class="mt-6 grid gap-4 sm:grid-cols-3">
            <ProfileStatCard v-for="stat in profileStats" :key="stat.label" :label="stat.label" :value="stat.value"
              :hint="stat.hint" :icon="stat.icon" />
          </div>
        </section>

        <section aria-labelledby="profile-posts-title" class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 id="profile-posts-title" class="text-lg font-semibold text-black">
                Letzte Lauf-Updates
              </h2>
              <p class="text-sm text-gray-600">
                Öffentlich sichtbare Beiträge der letzten Zeit.
              </p>
            </div>
            <NuxtLink v-if="profile.isSelf"
              class="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[var(--color-primary)]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
              to="/profile">
              <Icon icon="ph:pencil-duotone" class="h-5 w-5" aria-hidden="true" />
              Eigenes Profil bearbeiten
            </NuxtLink>
          </div>

          <div v-if="profile.posts.length" class="space-y-4">
            <article v-for="post in profile.posts" :key="post.id"
              class="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm backdrop-blur">
              <header class="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span
                  class="rounded-full border border-black/10 bg-gray-50 px-2 py-1 text-[11px] uppercase tracking-wide">
                  {{ visibilityLabel(post.visibility) }}
                </span>
                <span>{{ formatDate(post.createdAt) }}</span>
              </header>

              <p v-if="post.text" class="mt-4 whitespace-pre-line text-sm text-gray-800">
                {{ post.text }}
              </p>

              <div v-if="post.image" class="mt-4 overflow-hidden rounded-2xl">
                <NuxtImg :src="post.image" :alt="`Bild zum Beitrag von ${profile.user.name}`" width="960" height="540"
                  class="h-60 w-full object-cover" sizes="(min-width: 1024px) 40vw, 100vw" format="webp"
                  loading="lazy" />
              </div>

              <div v-if="hasRunData(post)" class="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
                  <Icon icon="ph:road-horizon-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
                  {{ formatDistance(post.runningExercise.distanceInMeters) }}
                </span>
                <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
                  <Icon icon="ph:timer-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
                  {{ formatDuration(post.runningExercise.durationInSeconds) }}
                </span>
              </div>
            </article>
          </div>
          <div v-else
            class="rounded-3xl border border-dashed border-black/10 bg-white/80 p-10 text-center text-sm text-gray-500">
            <p>Noch keine öffentlichen Aktivitäten sichtbar.</p>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useRoute } from 'vue-router'
import { useAsyncData, useFetch } from 'nuxt/app'
import ProfileStatCard from '../../components/profile/ProfileStatCard.vue'

type GroupRole = 'ADMIN' | 'MEMBER' | null
type Visibility = 'public' | 'protected' | 'private'

type PublicProfileResponse = {
  user: {
    id: string
    name: string
    nameId: string
    image: string | null
    bio: string
    group: {
      id: string
      name: string
      nameId: string
      role: GroupRole
    } | null
  }
  stats: {
    season: string
    runs: number
    distanceInMeters: number
    durationInSeconds: number
  }
  donations: { amountInCent: number }
  posts: Array<{
    id: string
    createdAt: string
    text: string
    image: string | null
    visibility: Visibility
    runningExercise: {
      distanceInMeters: number | null
      durationInSeconds: number | null
    }
  }>
  isSelf: boolean
}

const route = useRoute()
const nameId = computed(() => String(route.params.nameId ?? ''))

const { data, pending, error, refresh } = await useFetch<PublicProfileResponse>(
  `/api/users/${nameId.value}`,
  {
    credentials: 'include',
    key: `profile-${nameId.value}`,
    server: true,
    // useFetch handles cleanup better than useAsyncData for API calls
  }
)

const euroFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const formattedDonations = computed(() =>
  euroFormatter.format((data.value?.donations.amountInCent ?? 0) / 100)
)

const profile = computed(() => data.value ?? null)

// Computed property for profile stats using ProfileStatCard
const profileStats = computed(() => {
  if (!profile.value) return []

  return [
    {
      label: 'Läufe',
      value: profile.value.stats.runs.toString(),
      hint: 'Gesamtzahl',
      icon: 'ph:flag-checkered-duotone'
    },
    {
      label: 'Distanz',
      value: formatDistance(profile.value.stats.distanceInMeters),
      hint: 'Kilometer',
      icon: 'ph:road-horizon-duotone'
    },
    {
      label: 'Dauer',
      value: formatDuration(profile.value.stats.durationInSeconds),
      hint: 'Stunden & Minuten',
      icon: 'ph:timer-duotone'
    }
  ]
})

const errorMessage = computed(() => {
  if (!error.value) return ''

  if (error.value?.message?.includes('abort') ||
    error.value?.message?.includes('navigation') ||
    (error.value as any)?.statusCode === 499) {
    return ''
  }

  if ((error.value as any)?.statusCode === 404) {
    return 'Dieses Profil wurde nicht gefunden.'
  }
  console.error('[profile/public] Failed to load profile', error.value)
  return 'Das Profil konnte nicht geladen werden. Bitte versuche es später erneut.'
})

function formatDistance(meters: number | null | undefined) {
  if (!meters) return '0 km'
  return new Intl.NumberFormat('de-DE', {
    style: 'unit',
    unit: 'kilometer',
    maximumFractionDigits: 1,
  }).format(meters / 1000)
}

function formatDuration(totalSeconds: number | null | undefined) {
  const seconds = Math.max(0, Math.floor(totalSeconds ?? 0))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours} h ${String(minutes).padStart(2, '0')} min`
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '•'
}

function translateRole(role: GroupRole) {
  if (role === 'ADMIN') return 'Admin'
  if (role === 'MEMBER') return 'Mitglied'
  return 'Team'
}

function hasRunData(post: PublicProfileResponse['posts'][number]) {
  return Boolean(post.runningExercise.distanceInMeters || post.runningExercise.durationInSeconds)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function visibilityLabel(visibility: Visibility) {
  if (visibility === 'public') return 'öffentlich'
  if (visibility === 'protected') return 'community'
  return 'privat'
}
</script>
