<template>
  <div class="px-4 py-16">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <header class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Teams entdecken</p>
          <h1 class="text-3xl font-semibold text-black">Finde ein Team, das zu dir passt</h1>
          <p class="text-sm text-gray-600">
            Stöbere in der Community und schicke eine Anfrage an Teams, die dich interessieren.
          </p>
        </div>
        <NuxtLink to="/profile" class="text-sm text-[var(--color-primary)] underline-offset-2 hover:underline">
          ← Zurück zum Profil
        </NuxtLink>
      </header>

      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div class="flex w-full max-w-xl items-center gap-3 rounded-2xl border border-black/5 bg-white/80 px-4 py-3 shadow-sm">
          <Icon icon="ph:magnifying-glass-duotone" class="h-5 w-5 text-[var(--color-primary)]" />
          <input v-model="searchTerm" type="search" placeholder="Nach Teamname oder Standort suchen"
            class="w-full border-0 bg-transparent text-sm text-gray-700 outline-none focus:outline-none" />
        </div>
        <FormButton variant="ghost" :button-class="['text-sm text-[var(--color-primary)]']" @click="refresh">
          <Icon icon="ph:arrow-clockwise-duotone" class="mr-2 h-4 w-4" />
          Aktualisieren
        </FormButton>
      </div>

      <div v-if="pending" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div v-for="n in 6" :key="n" class="h-64 animate-pulse rounded-3xl border border-black/5 bg-white/70" />
      </div>

      <div v-else-if="errorMessage" class="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-600">
        {{ errorMessage }}
      </div>

      <div v-else>
        <div v-if="!teams.length" class="rounded-3xl border border-dashed border-black/10 bg-white/80 p-12 text-center text-gray-600">
          <p class="text-lg font-semibold text-black">Keine Teams gefunden.</p>
          <p class="mt-2 text-sm">Probiere andere Suchbegriffe oder starte dein eigenes Team.</p>
        </div>
        <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <article v-for="team in teams" :key="team.id"
            class="flex h-full flex-col rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div v-if="team.coverImage" class="mb-4 overflow-hidden rounded-2xl border border-black/5">
              <img :src="team.coverImage" :alt="team.name" class="h-36 w-full object-cover" />
            </div>

            <header class="mb-4">
              <NuxtLink :to="`/team/${team.nameId}`" class="text-xl font-semibold text-black hover:text-[var(--color-accent)]">
                {{ team.name }}
              </NuxtLink>
              <p class="mt-2 line-clamp-3 text-sm text-gray-600">
                {{ team.description || 'Noch keine Beschreibung vorhanden.' }}
              </p>
            </header>

            <div class="mb-4 space-y-2 text-sm text-gray-600">
              <div class="flex items-center gap-2">
                <Icon icon="ph:users-three-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
                <span>{{ team.memberCount }} Mitglieder</span>
              </div>
              <div class="flex items-center gap-2">
                <Icon icon="ph:map-pin-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
                <span>{{ team.location || 'Kein Standort angegeben' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Icon icon="ph:eye-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
                <span>{{ visibilityLabel(team.visibility, team.requireApproval) }}</span>
              </div>
              <div v-if="team.admin" class="flex items-center gap-2">
                <Icon icon="ph:crown-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
                <span>Admin: {{ team.admin.name }}</span>
              </div>
            </div>

            <div class="mb-4 flex flex-wrap gap-2">
              <NuxtLink v-for="member in team.previewMembers" :key="member.id" :to="`/profile/${member.nameId}`"
                class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-xs font-semibold text-[var(--color-primary)]"
                :title="member.name">
                <NuxtImg v-if="member.image" :src="member.image" :alt="member.name"
                  class="h-10 w-10 rounded-full object-cover" width="80" height="80" format="webp" />
                <span v-else>{{ member.name.slice(0, 2).toUpperCase() }}</span>
              </NuxtLink>
            </div>

            <div class="mt-auto space-y-3">
              <label v-if="canRequest(team)" class="block text-xs text-gray-500">
                Nachricht an das Team (optional)
                <textarea v-model="requestMessages[team.id]" rows="2" placeholder="Warum möchtest du beitreten?"
                  class="mt-1 w-full rounded-2xl border border-black/10 bg-white/90 px-3 py-2 text-xs text-gray-700 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
              </label>

              <div class="flex flex-wrap items-center gap-3">
                <FormButton v-if="team.viewer.isMember" variant="secondary" label="Zum Team"
                  @click="$router.push(`/team/${team.nameId}`)" />
                <FormButton v-else-if="team.viewer.belongsToOtherTeam"
                  variant="ghost"
                  :button-class="['text-xs text-gray-500']"
                  label="Du bist bereits in einem Team"
                  disabled />
                <FormButton v-else-if="team.viewer.requestStatus === 'pending'" variant="ghost"
                  :button-class="['text-xs text-gray-500']"
                  label="Anfrage ausstehend" disabled />
                <FormButton v-else-if="team.viewer.hasTeam"
                  variant="ghost"
                  :button-class="['text-xs text-gray-500']"
                  label="Du bist bereits in einem Team"
                  disabled />
                <FormButton v-else-if="team.viewer.requestStatus === 'approved'"
                  variant="ghost"
                  :button-class="['text-xs text-gray-500']"
                  label="Anfrage bereits bestätigt"
                  disabled />
                <FormButton v-else-if="team.viewer.requestStatus === 'declined'"
                  variant="ghost"
                  :button-class="['text-xs text-gray-500']"
                  label="Anfrage abgelehnt"
                  disabled />
                <FormButton
                  v-else-if="canJoinDirect(team)"
                  :loading="requestPending[team.id]"
                  label="Jetzt beitreten"
                  :button-class="['bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90']"
                  @click="joinTeamDirect(team)"
                />
                <FormButton
                  v-else-if="canRequest(team)"
                  :loading="requestPending[team.id]"
                  label="Beitritt anfragen"
                  @click="sendRequest(team)" />
                <FormButton
                  v-else
                  variant="ghost"
                  :button-class="['text-xs text-gray-500']"
                  label="Nur per Einladung"
                  disabled />
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useAsyncData, useCookie, useRequestHeaders } from 'nuxt/app'
import FormButton from '@/components/atoms/form/FormButton.vue'
import type { TeamSearchItem } from '@/types/team'
import { refreshAuthTeam } from '@/composables/useAuthTeam'

const searchTerm = ref('')
const csrf = useCookie('csrf_token')

const requestHeaders = useRequestHeaders(['cookie'])

const { data, pending, error, refresh } = await useAsyncData(
  () => `team-search-${searchTerm.value}`,
  () =>
    $fetch<{ teams: TeamSearchItem[] }>('/api/team/search', {
      credentials: 'include',
      headers: requestHeaders,
      params: searchTerm.value ? { q: searchTerm.value } : {},
    }),
  { watch: [searchTerm] },
)

const teams = computed(() => data.value?.teams ?? [])
const errorMessage = computed(() => {
  if (pending.value) return ''
  const err = error.value as { statusCode?: number; status?: number; message?: string } | null
  if (!err) return ''

  const status = err.statusCode ?? err.status
  if (status === 404) {
    return ''
  }

  console.error('[team/discover] Failed to load teams', err)
  return 'Teams konnten nicht geladen werden. Bitte versuche es später erneut.'
})

const requestMessages = reactive<Record<string, string>>({})
const requestPending = reactive<Record<string, boolean>>({})

function canJoinDirect(team: TeamSearchItem) {
  if (team.viewer.isMember || team.viewer.hasTeam || team.viewer.belongsToOtherTeam) return false
  if (team.viewer.requestStatus === 'pending') return false
  return team.visibility === 'public' && team.requireApproval === false
}

function canRequest(team: TeamSearchItem) {
  if (team.viewer.isMember || team.viewer.belongsToOtherTeam) return false
  if (team.viewer.requestStatus === 'pending' || team.viewer.hasTeam) return false
  if (team.viewer.requestStatus === 'approved' || team.viewer.requestStatus === 'declined') return false
  if (team.visibility !== 'public') return false
  return true
}

function visibilityLabel(visibility: TeamSearchItem['visibility'], requireApproval: boolean) {
  switch (visibility) {
    case 'public':
      return requireApproval ? 'Öffentlich · Anfragen' : 'Öffentlich · Direktbeitritt'
    case 'protected':
      return 'Geschützt · Einladung'
    case 'private':
      return 'Privat · Versteckt'
    default:
      return visibility
  }
}

async function joinTeamDirect(team: TeamSearchItem) {
  requestPending[team.id] = true
  try {
    await $fetch('/api/team/join', {
      method: 'POST',
      headers: { 'x-csrf-token': csrf.value ?? '' },
      credentials: 'include',
      body: { nameId: team.nameId },
    })
    await refresh()
    await refreshAuthTeam()
  } catch (err: any) {
    console.error('Direkter Beitritt fehlgeschlagen', err)
  } finally {
    requestPending[team.id] = false
  }
}

async function sendRequest(team: TeamSearchItem) {
  requestPending[team.id] = true
  try {
    const res = await $fetch<{ ok: boolean; joined?: boolean }>('/api/team/requests', {
      method: 'POST',
      headers: { 'x-csrf-token': csrf.value ?? '' },
      credentials: 'include',
      body: {
        nameId: team.nameId,
        message: requestMessages[team.id] || null,
      },
    })
    requestMessages[team.id] = ''
    if (res.joined) {
      await refresh()
      await refreshAuthTeam()
      return
    }
    await refresh()
  } catch (err: any) {
    console.error('Team-Anfrage fehlgeschlagen', err)
  } finally {
    requestPending[team.id] = false
  }
}
</script>
