<template>
  <div class="px-4 py-24">
    <div class="mx-auto flex w-full max-w-5xl flex-col gap-10">
      <header class="flex flex-col gap-3 text-center sm:text-left">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
          Community
        </p>
        <h1 class="text-3xl font-bold text-gray-900">Leaderboard</h1>
        <p class="text-base text-gray-600 sm:max-w-2xl">
          Entdecke die engagiertesten Läufer:innen der Season: Wer läuft am häufigsten, legt die größte Distanz zurück
          und verbringt die meiste Zeit auf der Strecke? Hier findest du die Top-Performer:innen.
        </p>
      </header>

      <section aria-labelledby="total-donations-title"
        class="rounded-3xl border border-black/5 bg-white/90 p-8 shadow-sm backdrop-blur">
        <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div class="space-y-1 text-center sm:text-left">
            <h2 id="total-donations-title" class="text-xl font-semibold text-gray-900">
              Gesamte Spenden
            </h2>
            <p class="text-sm text-gray-600">
              Summierte Spendenbeträge, die über eure Läufe ausgelöst wurden.
            </p>
          </div>
          <div class="flex flex-col items-center gap-2 sm:items-end">
            <span class="text-4xl font-bold tracking-tight text-[var(--color-accent)]">
              {{ formattedDonations }}
            </span>
            <span class="text-xs uppercase tracking-[0.2em] text-gray-500">
              Stand jetzt
            </span>
          </div>
        </div>
      </section>

      <div v-if="errorMessage" class="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        role="alert">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span>{{ errorMessage }}</span>
          <button type="button"
            class="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            @click="() => refresh()">
            <Icon icon="ph:arrow-clockwise-duotone" class="h-4 w-4" aria-hidden="true" />
            Erneut versuchen
          </button>
        </div>
      </div>

      <div v-else-if="pending" class="grid gap-6 lg:grid-cols-3">
        <div v-for="n in 3" :key="n" class="h-64 animate-pulse rounded-3xl border border-black/5 bg-white/70"></div>
      </div>

      <div v-else class="grid gap-6 lg:grid-cols-3">
        <section v-for="section in leaderboardSections" :key="section.id"
          class="flex h-full flex-col rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm backdrop-blur"
          :aria-labelledby="section.headingId">
          <div class="flex items-center gap-3">
            <span
              class="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-accent)]/10 text-[var(--color-primary)]">
              <Icon :icon="section.icon" class="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 :id="section.headingId" class="text-lg font-semibold text-gray-900">{{ section.title }}</h2>
              <p class="text-sm text-gray-600">{{ section.description }}</p>
            </div>
          </div>

          <ol v-if="section.entries.length" class="mt-6 space-y-4" role="list">
            <li v-for="(entry, index) in section.entries" :key="entry.id"
              class="flex items-center gap-4 rounded-2xl border border-black/5 bg-white/70 px-4 py-3 shadow-sm">
              <span
                class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-accent)]/10 text-sm font-semibold text-[var(--color-primary)]"
                aria-hidden="true">
                {{ index + 1 }}
              </span>
              <span class="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-black/10 bg-gray-100">
                <NuxtImg v-if="entry.image" :src="entry.image" :alt="`Profilbild von ${entry.name}`"
                  class="h-full w-full object-cover" width="48" height="48" loading="lazy" />
                <span v-else
                  class="grid h-full w-full place-items-center text-base font-semibold uppercase text-[var(--color-primary)]">
                  {{ entry.initials }}
                </span>
              </span>
              <div class="flex flex-1 flex-col">
                <p class="text-sm font-semibold text-gray-900">
                  <NuxtLink :to="profilePath(entry.nameId)"
                    class="inline-flex items-center text-sm font-semibold text-gray-900 transition hover:text-[var(--color-primary)] focus-visible:underline"
                    :aria-label="`Profil von ${entry.name} öffnen`">
                    {{ entry.name }}
                  </NuxtLink>
                </p>
                <p class="text-xs text-gray-500">
                  {{ entry.primary }}
                </p>
              </div>
            </li>
          </ol>

          <p v-else class="mt-6 text-sm text-gray-500">
            Noch keine Daten vorhanden. Sei die Erste oder der Erste, die/der etwas beiträgt!
          </p>
        </section>
      </div>

      <section v-if="teamSection" aria-labelledby="team-leaderboard-title"
        class="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm backdrop-blur">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="team-leaderboard-title" class="text-lg font-semibold text-gray-900">
              Team-Leaderboard
            </h2>
            <p class="text-sm text-gray-600">
              Platzierung der Teammitglieder nach Anzahl der Läufe.
            </p>
          </div>
          <Icon icon="ph:users-three-duotone" class="h-8 w-8 text-[var(--color-primary)]" aria-hidden="true" />
        </div>

        <ol v-if="teamSection.entries.length" class="mt-6 space-y-4" role="list">
          <li v-for="(entry, index) in teamSection.entries" :key="entry.id"
            class="flex items-center gap-4 rounded-2xl border border-black/5 bg-white/70 px-4 py-3 shadow-sm">
            <span
              class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-primary)]/10 text-sm font-semibold text-[var(--color-primary)]"
              aria-hidden="true">
              {{ index + 1 }}
            </span>
            <span class="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-black/10 bg-gray-100">
              <NuxtImg v-if="entry.image" :src="entry.image" :alt="`Profilbild von ${entry.name}`"
                class="h-full w-full object-cover" width="48" height="48" loading="lazy" />
              <span v-else
                class="grid h-full w-full place-items-center text-base font-semibold uppercase text-[var(--color-primary)]">
                {{ entry.initials }}
              </span>
            </span>
            <div class="flex flex-1 flex-col">
              <p class="text-sm font-semibold text-gray-900">
                <NuxtLink :to="profilePath(entry.nameId)"
                  class="inline-flex items-center text-sm font-semibold text-gray-900 transition hover:text-[var(--color-primary)] focus-visible:underline"
                  :aria-label="`Profil von ${entry.name} öffnen`">
                  {{ entry.name }}
                </NuxtLink>
              </p>
              <p class="text-xs text-gray-500">
                {{ entry.primary }}
              </p>
            </div>
          </li>
        </ol>
        <p v-else class="mt-6 text-sm text-gray-500">
          Noch keine Teamläufe registriert. Los geht&apos;s!
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useAsyncData } from 'nuxt/app'

type LeaderboardEntry = {
  id: string
  name: string
  nameId: string
  image: string | null
  runs: number
  distanceInMeters: number
  durationInSeconds: number
}

type LeaderboardResponse = {
  donations: { amountInCent: number }
  leaderboards: {
    runs: LeaderboardEntry[]
    distance: LeaderboardEntry[]
    duration: LeaderboardEntry[]
  }
  team: LeaderboardEntry[] | null
}

type DisplayEntry = LeaderboardEntry & { primary: string; initials: string }

const { data, pending, error, refresh } = await useAsyncData<LeaderboardResponse>(
  'leaderboard-page',
  () =>
    $fetch<LeaderboardResponse>('/api/leaderboard', {
      credentials: 'include',
    }),
  { server: true }
)

const euroFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const distanceFormatter = new Intl.NumberFormat('de-DE', {
  style: 'unit',
  unit: 'kilometer',
  maximumFractionDigits: 1,
})

const formattedDonations = computed(() =>
  euroFormatter.format((data.value?.donations.amountInCent ?? 0) / 100)
)

const errorMessage = computed(() => {
  if (!error.value) return ''
  return 'Das Leaderboard konnte nicht geladen werden.'
})

function formatDistance(meters: number) {
  if (!Number.isFinite(meters) || meters <= 0) return '0 km'
  return distanceFormatter.format(meters / 1000)
}

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const parts: string[] = []
  if (hours > 0) parts.push(`${hours} h`)
  parts.push(`${minutes} min`)
  return parts.join(' ')
}

function initials(name: string) {
  const matches = name
    .split(' ')
    .map((chunk) => chunk.trim().charAt(0))
    .filter(Boolean)
    .slice(0, 2)
  return matches.join('').toUpperCase() || '•'
}

function profilePath(nameId: string) {
  return `/profile/${encodeURIComponent(nameId)}`
}

function enrich(entries: LeaderboardEntry[], metric: 'runs' | 'distance' | 'duration'): DisplayEntry[] {
  return entries.map((entry) => {
    let primary = ''
    if (metric === 'runs') {
      primary = `${entry.runs} Läufe`
    } else if (metric === 'distance') {
      primary = `${formatDistance(entry.distanceInMeters)}`
    } else {
      primary = formatDuration(entry.durationInSeconds)
    }

    return {
      ...entry,
      primary,
      initials: initials(entry.name),
    }
  })
}

const leaderboardSections = computed(() => {
  const payload = data.value?.leaderboards
  if (!payload) {
    return [
      {
        id: 'runs',
        headingId: 'leaderboard-runs',
        title: 'Top Läufe',
        description: 'Wer die meisten Läufe eingetragen hat.',
        icon: 'ph:flag-checkered-duotone',
        entries: [] as DisplayEntry[],
      },
      {
        id: 'distance',
        headingId: 'leaderboard-distance',
        title: 'Top Distanz',
        description: 'Wer die längsten Strecken absolviert hat.',
        icon: 'ph:road-horizon-duotone',
        entries: [] as DisplayEntry[],
      },
      {
        id: 'duration',
        headingId: 'leaderboard-duration',
        title: 'Top Dauer',
        description: 'Wer die meiste Zeit auf den Beinen ist.',
        icon: 'ph:timer-duotone',
        entries: [] as DisplayEntry[],
      },
    ]
  }

  return [
    {
      id: 'runs',
      headingId: 'leaderboard-runs',
      title: 'Top Läufe',
      description: 'Wer die meisten Läufe eingetragen hat.',
      icon: 'ph:flag-checkered-duotone',
      entries: enrich(payload.runs, 'runs'),
    },
    {
      id: 'distance',
      headingId: 'leaderboard-distance',
      title: 'Top Distanz',
      description: 'Wer die längsten Strecken absolviert hat.',
      icon: 'ph:road-horizon-duotone',
      entries: enrich(payload.distance, 'distance'),
    },
    {
      id: 'duration',
      headingId: 'leaderboard-duration',
      title: 'Top Dauer',
      description: 'Wer die meiste Zeit auf den Beinen ist.',
      icon: 'ph:timer-duotone',
      entries: enrich(payload.duration, 'duration'),
    },
  ]
})

const teamSection = computed(() => {
  const entries = data.value?.team ? enrich(data.value.team, 'runs') : null
  if (!entries) return null
  return { entries }
})
</script>
