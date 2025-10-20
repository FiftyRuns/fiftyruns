<template>
  <ProfilePanel title="Meine Challenges" description="Verwalte deine aktiven und geplanten Herausforderungen.">
    <div v-if="challenges.length" class="space-y-4">
      <article
        v-for="challenge in challenges"
        :key="challenge.id"
        class="rounded-2xl border border-black/5 bg-white/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 class="text-base font-semibold text-gray-900">{{ challenge.name }}</h3>
            <p class="text-sm text-gray-500">{{ challenge.description }}</p>
          </div>
          <div class="flex items-center gap-2 text-xs text-gray-500">
            <Icon icon="ph:calendar-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
            <span>{{ challenge.period }}</span>
          </div>
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <span class="inline-flex items-center gap-1 rounded-full border border-[var(--color-primary)]/20 bg-white px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
            <Icon icon="ph:target-duotone" class="h-4 w-4" />
            {{ challenge.goal }}
          </span>
          <span v-if="challenge.participants" class="inline-flex items-center gap-1 text-xs text-gray-500">
            <Icon icon="ph:users-three-duotone" class="h-4 w-4" />
            {{ challenge.participants }} Teilnehmende
          </span>
        </div>
      </article>
    </div>
    <div v-else class="rounded-2xl border border-dashed border-black/10 bg-white/70 p-6 text-center text-sm text-gray-500">
      <Icon icon="ph:flag-banner-duotone" class="mx-auto mb-3 h-8 w-8 text-[var(--color-primary)]" />
      <p>Du hast noch keine Challenges angelegt. Starte eine neue Herausforderung und motiviere dein Team.</p>
      <FormButton class="mt-4" variant="secondary" label="Challenge erstellen" @click="$emit('create-challenge')" />
    </div>
  </ProfilePanel>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import ProfilePanel from '../profile/UserPostsList.vue'
import FormButton from '../atoms/form/FormButton.vue'

export type ChallengeSummary = {
  id: string
  name: string
  description: string
  period: string
  goal: string
  participants?: number
}

defineProps<{
  challenges: ChallengeSummary[]
}>()

defineEmits<{
  (e: 'create-challenge'): void
}>()
</script>
