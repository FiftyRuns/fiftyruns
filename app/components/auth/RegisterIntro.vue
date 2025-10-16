<template>
  <div class="mx-auto w-full max-w-2xl">
    <Textblock
      width="wide"
      align="left"
      eyebrow="WILLKOMMEN"
      title="Erstelle dein Konto"
      lead="Starte deine #50runs Challenge jetzt!"
    >
      <p class="text-gray-700 text-balance">
        Registriere dich, um Teil der Bewegung zu werden und mit jeder Laufeinheit etwas Gutes zu tun.
      </p>

      <div class="my-8 flex items-center gap-3" aria-hidden="true">
        <span class="inline-block h-1 w-16 rounded-full" :style="{ backgroundColor: 'var(--color-accent)' }"></span>
        <span class="inline-block h-1 flex-1 rounded-full bg-gray-200"></span>
      </div>

      <ul class="mt-6 grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
        <li v-for="usp in uspItems" :key="usp" class="flex items-center gap-2">
          <span class="inline-block size-1.5 rounded-full" :style="{ backgroundColor: 'var(--color-accent)' }"></span>
          {{ usp }}
        </li>
      </ul>
    </Textblock>

    <TextDivider text="#50runs 🏃" :repeat="1" textColor="var(--color-primary)" size-max="5rem" />
  </div>
</template>

<script setup lang="ts">
import Textblock from '../Textblock.vue';
import TextDivider from '../atoms/TextDivider.vue'

const uspItems = [
  'Schnelle & kostenlose Registrierung',
  'Challenges & Statistiken',
  'Teamarea',
  'Für alle Devices optimiert',
]
</script>
