<template>
  <div class="flex flex-col gap-2 rounded-2xl border border-black/5 bg-white/60 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-[var(--color-accent)]/40 hover:shadow-lg">
    <div class="inline-flex size-9 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
      <Icon :icon="icon" class="size-5" />
    </div>
    <h3 class="text-base font-semibold text-black">{{ title }}</h3>
    <p class="text-base text-gray-600 leading-relaxed">
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps<{
  icon: string
  title: string
  description: string
}>()
</script>
