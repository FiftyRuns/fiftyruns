<template>
  <div class="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white/80 p-5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md">
    <div class="flex items-center gap-3 text-[var(--color-primary)]">
      <slot name="icon">
        <Icon v-if="icon" :icon="icon" class="h-6 w-6" />
      </slot>
      <p class="text-sm font-medium uppercase tracking-wide text-gray-500">{{ label }}</p>
    </div>
    <p class="text-3xl font-semibold text-gray-900">
      <slot>{{ value }}</slot>
    </p>
    <p v-if="hint" class="text-xs text-gray-500">{{ hint }}</p>
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
