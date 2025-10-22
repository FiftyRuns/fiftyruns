<template>
  <section :class="panelClasses">
    <header v-if="title || description || $slots.actions" class="flex flex-col gap-3 border-b border-black/5 pb-5 md:flex-row md:items-center md:justify-between">
      <div class="space-y-1">
        <h2 v-if="title" class="text-lg font-semibold text-black">{{ title }}</h2>
        <p v-if="description" class="text-sm text-gray-500">
          <slot name="description">{{ description }}</slot>
        </p>
      </div>
      <div v-if="$slots.actions" class="flex shrink-0 items-center gap-3">
        <slot name="actions" />
      </div>
    </header>

    <div :class="contentClasses">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    padded?: boolean
    bleed?: boolean
  }>(),
  {
    padded: true,
    bleed: false,
  },
)

const panelClasses = computed(() => [
  'rounded-3xl border border-black/5 bg-white/90 shadow-sm backdrop-blur transition hover:shadow-lg',
  props.padded ? 'p-6 sm:p-8' : 'p-0',
])

const contentClasses = computed(() => (props.bleed ? 'pt-6' : 'mt-6 space-y-6'))
</script>
