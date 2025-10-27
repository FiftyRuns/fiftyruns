<template>
  <ProfilePanel :title="team ? 'Mein Team' : 'Team beitreten'" :description="team ? 'Bleib mit deinem Team synchronisiert.' : 'Finde ein Team, das zu deinen Zielen passt.'">
    <div v-if="team" class="space-y-5">
      <div class="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white/70 p-5 shadow">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 class="text-lg font-semibold text-black">{{ team.name }}</h3>
            <p class="text-sm text-gray-500">{{ team.description || 'Gemeinsam stärker – teile deine Läufe und motiviere andere.' }}</p>
          </div>
          <span class="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
            <Icon icon="ph:star-duotone" class="h-4 w-4" />
            {{ team.roleLabel || 'Mitglied' }}
          </span>
        </div>
        <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <span class="flex items-center gap-2">
            <Icon icon="ph:users-three-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
            {{ team.members }} Mitglieder
          </span>
          <span v-if="team.location" class="flex items-center gap-2">
            <Icon icon="ph:map-pin-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
            {{ team.location }}
          </span>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <FormButton variant="primary" label="Teamseite öffnen" @click="$emit('manage')" />
        <FormButton variant="secondary" label="Team verlassen" @click="$emit('leave-team')" />
      </div>
    </div>
    <div v-else class="space-y-4 rounded-2xl border border-dashed border-black/10 bg-white/70 p-6 text-center text-sm text-gray-500">
      <Icon icon="ph:users-three-duotone" class="mx-auto h-10 w-10 text-[var(--color-primary)]" />
      <p>Du bist derzeit in keinem Team. Tritt einem bestehenden Team bei oder gründe dein eigenes, um gemeinsam zu trainieren.</p>
      <div class="flex flex-wrap justify-center gap-3">
        <FormButton variant="primary" label="Teams entdecken" @click="$emit('discover')" />
        <FormButton variant="secondary" label="Eigenes Team gründen" @click="$emit('create-team')" />
      </div>
    </div>
  </ProfilePanel>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import ProfilePanel from './ProfilePanel.vue'
import FormButton from '../atoms/form/FormButton.vue'

export type TeamInfo = {
  id: string
  name: string
  nameId: string
  description?: string | null
  roleLabel?: string | null
  members: number
  location?: string | null
} | null

defineProps<{
  team: TeamInfo
}>()

defineEmits<{
  (e: 'manage'): void
  (e: 'leave-team'): void
  (e: 'create-team'): void
  (e: 'discover'): void
}>()
</script>
