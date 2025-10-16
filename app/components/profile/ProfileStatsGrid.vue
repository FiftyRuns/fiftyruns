<template>
  <ProfilePanel title="Deine Laufstatistiken" description="Alles auf einen Blick – bleib motiviert und sieh deine Fortschritte.">
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <ProfileStatCard
        v-for="item in stats"
        :key="item.label"
        :label="item.label"
        :value="item.value"
        :hint="item.hint"
        :icon="item.icon"
      />
    </div>
  </ProfilePanel>
</template>

<script setup lang="ts">
import ProfilePanel from '~/components/profile/ProfilePanel.vue'
import ProfileStatCard from '~/components/profile/ProfileStatCard.vue'

export type ProfileStat = {
  label: string
  value: string
  hint?: string
  icon?: string
}

defineProps<{
  stats: ProfileStat[]
}>()
</script>
