<template>
  <div class="mx-auto w-full max-w-2xl">
    <Textblock
      width="wide"
      align="left"
      eyebrow="WILLKOMMEN ZURÜCK"
      title="Melde dich bei 50runs an"
      lead="Bleib bei deinen Challenges und dem Team auf dem Laufenden."
    >
      <p class="text-gray-700 text-balance">
        Logge dich ein, um deine Läufe zu tracken, Statistiken zu vergleichen und gemeinsam mit der Community aktiv zu bleiben.
      </p>

      <div class="my-8 grid gap-4 sm:grid-cols-2">
        <FeatureCard
          v-for="feature in features"
          :key="feature.title"
          :icon="feature.icon"
          :title="feature.title"
          :description="feature.description"
        />
      </div>
    </Textblock>
  </div>
</template>

<script setup lang="ts">
import Textblock from '../Textblock.vue'
import FeatureCard from '../molecules/FeatureCard.vue'

const features = [
  {
    icon: 'ph:chart-line-duotone',
    title: 'Dein Fortschritt',
    description: 'Analysiere deine Läufe, verfolge Trends und vergleiche dich mit Freunden.',
  },
  {
    icon: 'ph:users-three-duotone',
    title: 'Team-Community',
    description: 'Bleib mit deinem Team verbunden und motiviert euch zu neuen Bestleistungen.',
  },
  {
    icon: 'ph:medal-duotone',
    title: 'Challenges meistern',
    description: 'Nimm an neuen Challenges teil und sichere dir Platzierungen in den Rankings.',
  },
  {
    icon: 'ph:bell-ringing-duotone',
    title: 'Smarte Benachrichtigungen',
    description: 'Verpass keine wichtige Aktivität – Updates für Posts, Reaktionen und Erwähnungen.',
  },
]
</script>
