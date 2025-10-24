<template>
  <div class="px-4 py-24">
    <div class="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 text-center text-gray-600">
      <Icon icon="ph:compass-duotone" class="h-12 w-12 text-[var(--color-primary)]" />
      <h1 class="text-2xl font-semibold text-black">Teamübersicht wird geladen…</h1>
      <p class="text-sm">Bitte einen Moment Geduld. Du wirst automatisch weitergeleitet.</p>
      <NuxtLink to="/team/discover" class="text-sm text-[var(--color-primary)] underline-offset-2 hover:underline">
        Oder Teams entdecken
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useAsyncData, navigateTo } from 'nuxt/app'

interface TeamMeResponse {
  team: {
    id: string
    nameId: string
    myRole: 'ADMIN' | 'MEMBER' | null
  } | null
}

const { data } = await useAsyncData('team-me-redirect', async () => {
  try {
    return await $fetch<TeamMeResponse>('/api/team/me', { credentials: 'include' })
  } catch {
    return { team: null }
  }
})

if (data.value?.team) {
  const team = data.value.team
  if (team.myRole === 'ADMIN') {
    navigateTo('/team/manage')
  } else {
    navigateTo(`/team/${team.nameId}`)
  }
} else {
  navigateTo('/team/discover')
}
</script>
