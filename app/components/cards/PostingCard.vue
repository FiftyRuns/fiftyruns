<template>
  <article
    class="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-black/5 bg-white/90 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
  >
    <!-- Header Slot -->
    <div class="border-b border-[var(--color-accent)]">
      <slot name="header" />
    </div>

    <!-- Content -->
    <div class="flex-1 p-4">
      <!-- Run Data -->
      <div v-if="showRunData && hasData" class="mb-3 flex flex-wrap items-center gap-2 text-xs text-gray-700">
        <span v-if="distanceInMeters" class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1">
          <Icon icon="ph:road-horizon-duotone" class="h-3.5 w-3.5 text-[var(--color-primary)]" />
          {{ formattedDistance }}
        </span>
        <span v-if="durationInSeconds" class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1">
          <Icon icon="ph:timer-duotone" class="h-3.5 w-3.5 text-[var(--color-primary)]" />
          {{ formattedDuration }}
        </span>
      </div>

      <!-- Text -->
      <p v-if="content" class="mb-3 line-clamp-3 text-sm leading-relaxed text-gray-800">
        {{ content }}
      </p>

      <!-- Image -->
      <div v-if="image" class="overflow-hidden rounded-xl bg-gray-100">
        <NuxtImg
          :src="image"
          :alt="imageAlt"
          class="w-full h-auto object-contain"
          width="480"
          height="360"
          loading="lazy"
          sizes="xs:100vw sm:50vw md:33vw lg:25vw"
        />
      </div>
    </div>

    <!-- Footer Slot -->
    <div class="border-t border-gray-100 bg-gray-50/50">
      <slot name="footer" />
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

// Cached formatters outside component
const distanceFormatter = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

function formatDistance(meters: number) {
  const km = meters / 1000
  return `${distanceFormatter.format(km)} km`
}

function formatDuration(seconds: number) {
  const value = Math.max(0, Math.floor(seconds))
  const h = Math.floor(value / 3600)
  const m = Math.floor((value % 3600) / 60)
  const s = value % 60
  return [h, m, s].map((unit) => String(unit).padStart(2, '0')).join(':')
}

const props = defineProps<{
  // Content
  content?: string
  image?: string | null
  imageAlt?: string
  
  // Run data
  distanceInMeters?: number | null
  durationInSeconds?: number | null
  showRunData?: boolean
}>()

const hasData = computed(() => 
  props.distanceInMeters != null || props.durationInSeconds != null
)

const formattedDistance = computed(() => 
  props.distanceInMeters != null 
    ? formatDistance(props.distanceInMeters) 
    : ''
)

const formattedDuration = computed(() => 
  props.durationInSeconds != null 
    ? formatDuration(props.durationInSeconds) 
    : ''
)
</script>

