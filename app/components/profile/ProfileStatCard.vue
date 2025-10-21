<template>
  <div class="flex flex-col gap-3 rounded-2xl border border-black/5 bg-gradient-to-br from-white via-white to-[var(--color-accent)]/10 p-5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md">
    <div class="flex items-center gap-3 text-[var(--color-accent)]">
      <slot name="icon">
        <Icon v-if="icon" :icon="icon" class="h-6 w-6" />
      </slot>
      <p class="text-sm font-medium uppercase tracking-wide text-[var(--color-primary)]">{{ label }}</p>
    </div>
    <p class="text-3xl font-semibold text-gray-900">
      <slot>{{ value }}</slot>
    </p>
    <p v-if="hint" class="text-xs text-[var(--color-primary)]">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps<{
  label: string
  value: string | number
  hint?: string
  icon?: string
}>()
</script>
