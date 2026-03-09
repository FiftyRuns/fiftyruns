<template>
  <section :class="panelClasses">
    <header
      v-if="title || description || $slots.actions"
      class="flex flex-col gap-3 border-b border-black/5 pb-5 md:flex-row md:items-center md:justify-between"
      :class="collapsible ? 'cursor-pointer select-none' : ''"
      @click="collapsible ? toggle() : undefined"
    >
      <div class="space-y-1">
        <h2 v-if="title" class="text-lg font-semibold text-black">{{ title }}</h2>
        <p v-if="description" class="text-sm text-gray-500">
          <slot name="description">{{ description }}</slot>
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-3">
        <div v-if="$slots.actions">
          <slot name="actions" />
        </div>
        <svg
          v-if="collapsible"
          class="h-5 w-5 text-gray-400 transition-transform duration-300"
          :class="isOpen ? 'rotate-0' : '-rotate-90'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </header>

    <Transition :css="false" @enter="onEnter" @after-enter="onAfterEnter" @leave="onLeave">
      <div v-if="isOpen" :class="contentClasses">
        <slot />
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    padded?: boolean
    bleed?: boolean
    collapsible?: boolean
    defaultOpen?: boolean
  }>(),
  {
    padded: true,
    bleed: false,
    collapsible: false,
    defaultOpen: true,
  },
)

const isOpen = ref(props.collapsible ? (props.defaultOpen ?? true) : true)

function toggle() {
  isOpen.value = !isOpen.value
}

function onEnter(el: Element) {
  const e = el as HTMLElement
  e.style.height = '0'
  e.style.opacity = '0'
  e.style.overflow = 'hidden'
  e.style.transition = 'height 0.3s ease, opacity 0.25s ease'
  requestAnimationFrame(() => {
    e.style.height = e.scrollHeight + 'px'
    e.style.opacity = '1'
  })
}

function onAfterEnter(el: Element) {
  const e = el as HTMLElement
  e.style.height = 'auto'
  e.style.overflow = ''
  e.style.transition = ''
  e.style.opacity = ''
}

function onLeave(el: Element, done: () => void) {
  const e = el as HTMLElement
  e.style.height = e.scrollHeight + 'px'
  e.style.opacity = '1'
  e.style.overflow = 'hidden'
  requestAnimationFrame(() => {
    e.style.transition = 'height 0.25s ease, opacity 0.2s ease'
    e.style.height = '0'
    e.style.opacity = '0'
    e.addEventListener('transitionend', done, { once: true })
  })
}

const panelClasses = computed(() => [
  'rounded-3xl border border-black/5 bg-white/90 shadow-sm backdrop-blur transition hover:shadow-lg',
  props.padded ? 'p-6 sm:p-8' : 'p-0',
])

const contentClasses = computed(() => (props.bleed ? 'pt-6' : 'mt-6 space-y-6'))
</script>
