<template>
  <div class="px-4 py-16">
    <div class="mx-auto flex w-full max-w-5xl flex-col gap-10">
      <NuxtLink to="/team/discover" class="text-sm text-[var(--color-primary)] underline-offset-2 hover:underline">
        ← Zurück zur Übersicht
      </NuxtLink>

      <div v-if="pending" class="grid gap-4">
        <div class="h-48 animate-pulse rounded-3xl border border-black/5 bg-white/70" />
        <div class="h-64 animate-pulse rounded-3xl border border-black/5 bg-white/70" />
      </div>

      <div v-else-if="errorMessage" class="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-600">
        {{ errorMessage }}
      </div>

      <div v-else-if="!team" class="rounded-3xl border border-dashed border-black/10 bg-white/80 px-6 py-10 text-center text-gray-600">
        <p class="text-lg font-semibold text-black">Team nicht gefunden.</p>
        <p class="mt-2 text-sm">Vielleicht wurde es umbenannt oder gelöscht.</p>
      </div>

      <div v-else class="space-y-8">
        <header class="overflow-hidden rounded-3xl border border-black/5 bg-white/90 shadow-sm">
          <div class="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Team</p>
              <h1 class="text-3xl font-semibold text-black">{{ team.name }}</h1>
              <p class="mt-2 text-sm text-gray-600">
                {{ team.description || 'Dieses Team hat noch keine Beschreibung hinterlegt.' }}
              </p>
              <div class="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span class="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)]/10 px-3 py-1 font-semibold text-[var(--color-primary)]">
                  <Icon icon="ph:users-three-duotone" class="h-4 w-4" />
                  {{ team.memberCount }} Mitglieder
                </span>
                <span class="inline-flex items-center gap-2">
                  <Icon icon="ph:map-pin-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
                  {{ team.location || 'Kein Standort angegeben' }}
                </span>
                <span v-if="team.createdAt" class="inline-flex items-center gap-2">
                  <Icon icon="ph:calendar-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
                  gegründet {{ formatDate(team.createdAt) }}
                </span>
                <span class="inline-flex items-center gap-2">
                  <Icon icon="ph:eye-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
                  {{ visibilityLabel(team.visibility, team.requireApproval) }}
                </span>
              </div>
            </div>

            <div class="flex flex-col items-start gap-3 md:items-end">
              <div v-if="team.admin" class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-sm font-semibold text-[var(--color-primary)]">
                  <NuxtImg
                    v-if="team.admin.image"
                    :src="team.admin.image"
                    :alt="team.admin.name"
                    class="h-12 w-12 rounded-full object-cover"
                    width="96"
                    height="96"
                    format="webp"
                  />
                  <span v-else>{{ team.admin.name.slice(0, 2).toUpperCase() }}</span>
                </div>
                <div>
                  <p class="text-xs uppercase tracking-[0.2em] text-gray-500">Team-Admin</p>
                  <p class="text-sm font-semibold text-black">{{ team.admin.name }}</p>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <FormButton
                  v-if="team.viewer.isMember && team.viewer.role === 'ADMIN'"
                  label="Team verwalten"
                  :button-class="['bg-[var(--color-accent)] text-black hover:bg-[var(--color-accent)]/90']"
                  @click="$router.push('/team/manage')"
                />
                <FormButton
                  v-else-if="team.viewer.isMember"
                  variant="secondary"
                  label="Du bist Mitglied"
                  disabled
                />
                <FormButton
                  v-else-if="team.viewer.requestStatus === 'pending'"
                  variant="ghost"
                  :button-class="['text-xs text-gray-500']"
                  label="Anfrage ausstehend"
                  disabled
                />
                <FormButton
                  v-else-if="team.viewer.requestStatus === 'approved'"
                  variant="ghost"
                  :button-class="['text-xs text-gray-500']"
                  label="Anfrage angenommen – überprüfe deine E-Mails"
                  disabled
                />
                <FormButton
                  v-else-if="team.viewer.requestStatus === 'declined'"
                  variant="ghost"
                  :button-class="['text-xs text-gray-500']"
                  label="Letzte Anfrage wurde abgelehnt"
                  disabled
                />
              </div>
            </div>
          </div>
        </header>

        <section
          v-if="canJoinDirect"
          class="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm"
        >
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 class="text-xl font-semibold text-black">Direkt beitreten</h2>
              <p class="text-sm text-gray-600">
                Dieses Team nimmt neue Mitglieder ohne Freigabe auf. Tritt jetzt bei und starte mit ihnen durch.
              </p>
            </div>
            <FormButton
              :loading="submitState.loading"
              label="Jetzt beitreten"
              :button-class="['bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90']"
              @click="joinTeamDirect"
            />
          </div>
          <p v-if="submitState.success" class="mt-3 text-sm text-green-600">{{ submitState.success }}</p>
          <p v-else-if="submitState.error" class="mt-3 text-sm text-red-600">{{ submitState.error }}</p>
        </section>

        <section
          v-else-if="canSendRequest"
          class="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm"
        >
          <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 class="text-xl font-semibold text-black">Beitritt anfragen</h2>
              <p class="text-sm text-gray-600">
                Schreib dem Admin, warum du mitlaufen möchtest. Nach Bestätigung erhältst du eine Benachrichtigung.
              </p>
            </div>
          </div>
          <form class="mt-4 grid gap-4 md:grid-cols-[minmax(0,2fr),auto]" @submit.prevent="submitRequest">
            <textarea
              v-model="message"
              rows="3"
              placeholder="Deine Nachricht an das Team"
              class="rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm text-gray-700 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            />
            <div class="flex items-start">
              <FormButton type="submit" :loading="submitState.loading" label="Anfrage senden" />
            </div>
          </form>
          <p v-if="submitState.error" class="mt-2 text-sm text-red-600">{{ submitState.error }}</p>
          <p v-else-if="submitState.success" class="mt-2 text-sm text-green-600">{{ submitState.success }}</p>
        </section>

        <section
          v-else-if="!team.viewer.isAuthenticated"
          class="rounded-3xl border border-black/5 bg-white/80 p-6 text-sm text-gray-600"
        >
          <p class="flex items-center gap-2">
            <Icon icon="ph:info-duotone" class="h-5 w-5 text-[var(--color-primary)]" />
            Melde dich an, um eine Beitrittsanfrage zu senden.
          </p>
          <NuxtLink
            to="/login"
            class="mt-3 inline-flex items-center gap-2 text-sm text-[var(--color-primary)] underline-offset-2 hover:underline"
          >
            Jetzt anmelden
          </NuxtLink>
        </section>

        <section
          v-else-if="team.viewer.belongsToOtherTeam"
          class="rounded-3xl border border-black/5 bg-white/80 p-6 text-sm text-gray-600"
        >
          <p class="flex items-center gap-2">
            <Icon icon="ph:info-duotone" class="h-5 w-5 text-[var(--color-primary)]" />
            Du bist bereits Mitglied eines anderen Teams. Verlasse dein aktuelles Team, um hier anzufragen.
          </p>
        </section>

        <section class="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm">
          <header class="mb-6 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-black">Mitglieder</h2>
            <span class="text-sm text-gray-500">{{ team.members.length }} angezeigt</span>
          </header>
          <div class="grid gap-4 md:grid-cols-2">
            <article
              v-for="member in team.members"
              :key="member.id"
              class="flex items-center gap-4 rounded-2xl border border-black/5 bg-white/70 p-4 shadow-sm"
            >
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-sm font-semibold text-[var(--color-primary)]">
                <NuxtImg
                  v-if="member.image"
                  :src="member.image"
                  :alt="member.name"
                  class="h-12 w-12 rounded-full object-cover"
                  width="96"
                  height="96"
                  format="webp"
                />
                <span v-else>{{ member.name.slice(0, 2).toUpperCase() }}</span>
              </div>
              <div>
                <p class="text-sm font-semibold text-black">{{ member.name }}</p>
                <p class="text-xs text-gray-500">{{ member.roleLabel }}</p>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useAsyncData, useCookie, useRequestHeaders } from 'nuxt/app'
import { useRoute } from 'vue-router'
import FormButton from '@/components/atoms/form/FormButton.vue'
import type { TeamDetail } from '@/types/team'
import { refreshAuthTeam } from '@/composables/useAuthTeam'

const route = useRoute()
const nameId = computed(() => {
  const param = route.params.nameId
  if (typeof param === 'string' && param.length > 0) {
    return param
  }
  if (Array.isArray(param) && param.length > 0) {
    return param[0]
  }
  return null
})
const csrf = useCookie('csrf_token')

const requestHeaders = useRequestHeaders(['cookie'])

const { data, pending, error, refresh } = await useAsyncData(
  () => (nameId.value ? `team-detail-${nameId.value}` : 'team-detail'),
  async () => {
    const slug = nameId.value
    if (!slug) {
      return { team: null as TeamDetail | null }
    }
    return $fetch<{ team: TeamDetail }>(`/api/team/${slug}`, {
      credentials: 'include',
      headers: requestHeaders,
    })
  },
  { watch: [nameId] },
)

const team = computed(() => data.value?.team ?? null)
const errorMessage = computed(() => {
  if (!pending.value && error.value && !data.value?.team) {
    if (process.dev) {
      console.error('[team/detail] Failed to load team', error.value)
    }
    return 'Team konnte nicht geladen werden. Bitte versuchen Sie es später erneut.'
  }
  return ''
})

const message = ref('')
const submitState = ref({ loading: false, success: '', error: '' })

const canJoinDirect = computed(() => {
  if (!team.value) return false
  const viewer = team.value.viewer
  if (!viewer.isAuthenticated || viewer.isMember || viewer.belongsToOtherTeam) return false
  if (viewer.requestStatus === 'pending') return false
  return team.value.visibility === 'public' && team.value.requireApproval === false
})

const canSendRequest = computed(() => {
  if (!team.value) return false
  const viewer = team.value.viewer
  console.log(viewer.isAuthenticated)
  if (!viewer.isAuthenticated || viewer.isMember || viewer.belongsToOtherTeam) return false
  if (viewer.requestStatus === 'pending' || viewer.hasPendingRequest) return false
  if (!viewer.canRequestToJoin) return false
  return team.value.visibility === 'public'
})

function visibilityLabel(visibility: TeamDetail['visibility'], requireApproval: boolean) {
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

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

async function submitRequest() {
  if (!team.value) return
  submitState.value = { loading: true, success: '', error: '' }
  try {
    const res = await $fetch<{ ok: boolean; joined?: boolean }>('/api/team/requests', {
      method: 'POST',
      headers: { 'x-csrf-token': csrf.value ?? '' },
      credentials: 'include',
      body: {
        nameId: team.value.nameId,
        message: message.value || null,
      },
    })

    if (res.joined) {
      await refresh()
      await refreshAuthTeam()
      submitState.value = { loading: false, success: 'Willkommen im Team!', error: '' }
      return
    }

    message.value = ''
    submitState.value = { loading: false, success: 'Anfrage gesendet. Wir drücken die Daumen!', error: '' }
    await refresh()
  } catch (err: any) {
    submitState.value = {
      loading: false,
      success: '',
      error: err?.data?.message || err?.message || 'Anfrage konnte nicht gesendet werden.',
    }
  }
}

async function joinTeamDirect() {
  if (!team.value) return
  submitState.value = { loading: true, success: '', error: '' }
  try {
    await $fetch('/api/team/join', {
      method: 'POST',
      headers: { 'x-csrf-token': csrf.value ?? '' },
      credentials: 'include',
      body: { nameId: team.value.nameId },
    })
    await refresh()
    await refreshAuthTeam()
    submitState.value = { loading: false, success: 'Du bist dem Team beigetreten!', error: '' }
  } catch (err: any) {
    submitState.value = {
      loading: false,
      success: '',
      error: err?.data?.message || err?.message || 'Beitritt nicht möglich.',
    }
  }
}
</script>
