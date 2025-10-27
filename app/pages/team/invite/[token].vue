<template>
  <div class="px-4 py-20">
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <NuxtLink to="/team/discover" class="text-sm text-[var(--color-primary)] underline-offset-2 hover:underline">
        ← Zurück zu den Teams
      </NuxtLink>

      <div v-if="pending" class="h-56 animate-pulse rounded-3xl border border-black/5 bg-white/70" />

      <div v-else-if="errorMessage" class="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-600">
        {{ errorMessage }}
      </div>

      <div v-else-if="!invite" class="rounded-3xl border border-dashed border-black/10 bg-white/80 px-6 py-10 text-center text-gray-600">
        Einladung nicht gefunden.
      </div>

      <div v-else class="space-y-6 rounded-3xl border border-black/5 bg-white/90 p-8 shadow-sm">
        <header class="space-y-2">
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Teameinladung</p>
          <h1 class="text-3xl font-semibold text-black">Willkommen bei {{ invite.group.name }}</h1>
          <p class="text-sm text-gray-600">
            Du wurdest eingeladen, dem Team beizutreten. Nach der Bestätigung bist du sofort Mitglied.
          </p>
        </header>

        <div class="space-y-3 text-sm text-gray-600">
          <p v-if="invite.email">Diese Einladung ist an <strong>{{ invite.email }}</strong> adressiert.</p>
          <p v-if="invite.note">Nachricht: „{{ invite.note }}“</p>
          <p>
            Status:
            <span :class="statusClass">{{ statusLabel }}</span>
          </p>
          <p>Gültig bis {{ formatDate(invite.expiresAt) }}</p>
        </div>

        <div class="space-y-4">
          <FormButton v-if="canAccept" :loading="state.loading" label="Einladung annehmen" @click="acceptInvite" />
          <p v-if="state.success" class="text-sm text-green-600">{{ state.success }}</p>
          <p v-else-if="state.error" class="text-sm text-red-600">{{ state.error }}</p>
          <NuxtLink v-if="state.success" :to="`/team/${invite.group.nameId}`"
            class="inline-flex items-center gap-2 text-sm text-[var(--color-primary)] underline-offset-2 hover:underline">
            Zum Team wechseln →
          </NuxtLink>
        </div>

        <div v-if="!isAuthenticated" class="rounded-2xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 px-4 py-3 text-sm text-gray-600">
          Bitte melde dich an, um die Einladung anzunehmen.
          <NuxtLink to="/login" class="ml-2 text-[var(--color-primary)] underline-offset-2 hover:underline">Jetzt anmelden</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAsyncData, useCookie } from 'nuxt/app'
import { useRoute } from 'vue-router'
import FormButton from '@/components/atoms/form/FormButton.vue'

interface InvitePayload {
  invite: {
    id: string
    email: string
    note: string
    status: 'pending' | 'accepted' | 'expired'
    expiresAt: string
    group: {
      id: string
      name: string
      nameId: string
      description: string
      location: string
    }
  }
}

const route = useRoute()
const token = computed(() => route.params.token as string)
const csrf = useCookie('csrf_token')

const { data, pending, error, refresh } = await useAsyncData(
  () => `team-invite-${token.value}`,
  () => $fetch<InvitePayload>(`/api/team/invite/${token.value}`),
  { watch: [token] },
)

const invite = computed(() => data.value?.invite ?? null)
const errorMessage = computed(() => {
  if (pending.value) return ''
  const err = error.value as unknown
  if (!err) return ''

  console.error('[team/invite] Failed to load invite', err)
  return 'Einladung konnte nicht geladen werden. Bitte versuche es später erneut.'
})

const isAuthenticated = computed(() => Boolean(useCookie('session_token').value))

const state = ref({ loading: false, success: '', error: '' })

const canAccept = computed(() => {
  if (!invite.value) return false
  if (!isAuthenticated.value) return false
  return invite.value.status === 'pending'
})

const statusLabel = computed(() => {
  if (!invite.value) return ''
  switch (invite.value.status) {
    case 'pending':
      return 'Offen'
    case 'accepted':
      return 'Bereits angenommen'
    case 'expired':
      return 'Abgelaufen'
    default:
      return invite.value.status
  }
})

const statusClass = computed(() => {
  if (!invite.value) return ''
  switch (invite.value.status) {
    case 'pending':
      return 'font-semibold text-[var(--color-primary)]'
    case 'accepted':
      return 'font-semibold text-green-600'
    case 'expired':
      return 'font-semibold text-red-500'
    default:
      return ''
  }
})

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

async function acceptInvite() {
  if (!invite.value || !canAccept.value) return
  state.value = { loading: true, success: '', error: '' }
  try {
    await $fetch('/api/team/invite/accept', {
      method: 'POST',
      headers: { 'x-csrf-token': csrf.value ?? '' },
      credentials: 'include',
      body: {
        token: token.value,
      },
    })
    state.value = { loading: false, success: 'Einladung angenommen! Willkommen im Team.', error: '' }
    await refresh()
  } catch (err: any) {
    state.value = {
      loading: false,
      success: '',
      error: err?.data?.message || err?.message || 'Einladung konnte nicht angenommen werden.',
    }
  }
}
</script>
