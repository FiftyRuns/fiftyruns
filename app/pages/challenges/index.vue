<template>
  <div class="px-4 py-12">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div class="mb-5">
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)] mb-2">Community Challenges
          </p>
          <h1 class="mt-1 text-3xl  font-semibold text-black mb-2">Finde deine nächste Challenge</h1>
          <p class="text-sm text-gray-600">
            Trete öffentlichen Challenges bei oder starte deine eigene, um gemeinsam Ziele zu erreichen.
          </p>
        </div>
        <NuxtLink v-if="isLoggedIn" to="/challenges/create"
          class="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)]/10 px-4 py-2 text-sm font-semibold  text-black shadow transition hover:bg-[var(--color-accent)]/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]">
          <Icon icon="ph:plus-circle-duotone" class="h-5 w-5" aria-hidden="true" />
          Challenge erstellen
        </NuxtLink>
      </header>

      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          class="flex w-full max-w-xl items-center gap-3 rounded-2xl border border-black/5 bg-white/80 px-4 py-2 shadow-sm">
          <Icon icon="ph:magnifying-glass-duotone" class="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
          <input v-model="searchTerm" type="search" placeholder="Challenge suchen"
            class="w-full border-0 bg-transparent text-sm text-gray-700 outline-none focus:outline-none" />
        </div>
        <FormButton type="button" variant="ghost"
          :button-class="['border border-[var(--color-accent)]/10  text-black hover:bg-gray-100']" class="hidden sm:inline-flex"
          @click="() => refresh()">
          <Icon icon="ph:arrow-clockwise-duotone" class="mr-2 h-4 w-4" aria-hidden="true" />
          Aktualisieren
        </FormButton>
      </div>

      <div v-if="errorMessage" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ errorMessage }}
      </div>

      <div v-else>
        <div v-if="pending" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="n in 6" :key="n" class="h-60 animate-pulse rounded-3xl border border-black/5 bg-white/60"></div>
        </div>
        <div v-else-if="!challenges.length"
          class="rounded-3xl border border-dashed border-black/10 bg-white/80 p-12 text-center shadow-sm">
          <p class="text-lg font-semibold text-gray-800">Noch keine Challenges gefunden.</p>
          <p class="mt-2 text-sm text-gray-600">Starte deine eigene Challenge oder überprüfe die Suchbegriffe.</p>
        </div>
        <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <article v-for="challenge in challenges" :key="challenge.id"
            class="flex h-full flex-col rounded-3xl border border-black/5 bg-white/90 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <NuxtLink :to="`/challenges/${challenge.nameId}`" class="group relative block">
              <div v-if="challenge.image" class="h-40 w-full overflow-hidden rounded-t-3xl">
                <NuxtImg :src="challenge.image" :alt="challenge.name"
                  class="h-full w-full object-cover transition group-hover:scale-105" width="720" height="320"
                  format="webp" />
              </div>
              <div v-else
                class="flex h-40 items-center justify-center rounded-t-3xl bg-[var(--color-accent)]/10 text-3xl  font-semibold  text-black">
                {{ challengeInitials(challenge.name) }}
              </div>
              <span
                class="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--color-primary)] shadow">
                <Icon icon="ph:calendar-duotone" class="h-4 w-4" />
                {{ challenge.period }}
              </span>
            </NuxtLink>

            <div class="flex flex-1 flex-col gap-4 px-5 py-4">
              <div>
                <NuxtLink :to="`/challenges/${challenge.nameId}`"
                  class="text-lg font-semibold  text-black hover:text-[var(--color-accent)]">
                  {{ challenge.name }}
                </NuxtLink>
                <p class="mt-1 text-sm text-gray-600 line-clamp-3">{{ challenge.description }}</p>
              </div>

              <div class="space-y-2 text-xs text-gray-600">
                <div
                  class="inline-flex items-center gap-2 rounded-full py-1 font-medium text-gray">
                  <Icon icon="ph:target-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
                  {{ challenge.goal }}
                </div>
                <div v-if="challenge.minRequirements" class="flex items-center gap-2">
                  <Icon icon="ph:check-circle-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
                  <span class="text-gray font-medium">{{ challenge.minRequirements }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <Icon icon="ph:users-three-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
                  <span class="text-gray font-medium">{{ challenge.participants }} Teilnehmer:innen</span>
                </div>
              </div>

              <div class="mt-auto flex flex-wrap items-center gap-3">
                <NuxtLink :to="`/challenges/${challenge.nameId}`"
                  class="inline-flex items-center gap-2 rounded-xl border border-black/10 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100">
                  Mehr erfahren
                </NuxtLink>
                <button v-if="isLoggedIn" type="button"
                  class="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold text-white shadow transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  :class="challenge.isMember ? 'bg-red-500 hover:bg-red-600 focus-visible:outline-red-500' : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 focus-visible:outline-[var(--color-primary)]'"
                  :disabled="actionPending[challenge.id]"
                  @click="challenge.isMember ? leaveChallenge(challenge) : joinChallenge(challenge)">
                  <Icon :icon="challenge.isMember ? 'ph:sign-out-duotone' : 'ph:sign-in-duotone'" class="h-4 w-4"
                    aria-hidden="true" />
                  <span>
                    <template v-if="actionPending[challenge.id]">Wird verarbeitet…</template>
                    <template v-else>{{ challenge.isMember ? 'Verlassen' : 'Beitreten' }}</template>
                  </span>
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useCookie } from 'nuxt/app'
import { useAuthUser } from '@/composables/useAuthUser'
import { useAsyncData } from 'nuxt/app'
import FormButton from '@/components/atoms/form/FormButton.vue'

interface ChallengeListItem {
  id: string
  name: string
  nameId: string
  description: string
  image: string | null
  period: string
  goal: string
  minRequirements: string
  participants: number
  sponsorLogos?: string[]
  isMember: boolean
}

const authUser = useAuthUser()
const isLoggedIn = computed(() => Boolean(authUser.value))

const searchTerm = ref('')
const actionPending = reactive<Record<string, boolean>>({})
const csrf = useCookie('csrf_token')

const { data, pending, error, refresh } = await useAsyncData(
  () => `challenges-${searchTerm.value}`,
  () =>
    $fetch<ChallengeListItem[]>('/api/challenges', {
      credentials: 'include',
      params: searchTerm.value ? { search: searchTerm.value } : {},
    }),
  { watch: [searchTerm] },
)

const errorMessage = computed(() => (error.value ? 'Challenges konnten nicht geladen werden.' : ''))
const challenges = computed(() => data.value ?? [])

function challengeInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

async function joinChallenge(challenge: ChallengeListItem) {
  if (actionPending[challenge.id]) return
  actionPending[challenge.id] = true
  try {
    await $fetch(`/api/challenges/${challenge.nameId}/join`, {
      method: 'POST',
      headers: { 'x-csrf-token': csrf.value ?? '' },
      credentials: 'include',
    })
    await refresh()
  } catch (err) {
    console.error('Challenge beitreten fehlgeschlagen', err)
  } finally {
    actionPending[challenge.id] = false
  }
}

async function leaveChallenge(challenge: ChallengeListItem) {
  if (actionPending[challenge.id]) return
  actionPending[challenge.id] = true
  try {
    await $fetch(`/api/challenges/${challenge.nameId}/leave`, {
      method: 'POST',
      headers: { 'x-csrf-token': csrf.value ?? '' },
      credentials: 'include',
    })
    await refresh()
  } catch (err) {
    console.error('Challenge verlassen fehlgeschlagen', err)
  } finally {
    actionPending[challenge.id] = false
  }
}
</script>
