<template>
  <div class="border border-[#a2c92d] rounded-2xl bg-white/80 shadow-sm backdrop-blur-sm">
    <button @click="isOpen = !isOpen"
      class="w-full text-left px-6 py-5 flex justify-between items-center font-semibold text-[#01497e] hover:bg-[#a2c92d]/15 transition-colors rounded-2xl focus:outline-none"
      :aria-expanded="isOpen">
      <span>{{ question }}</span>
      <svg :class="['w-6 h-6 transition-transform', isOpen ? 'rotate-180' : 'rotate-0']" fill="none"
        stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div v-show="isOpen" class="px-6 pb-6 text-[#01497e]/90">
      <div class="pt-2 text-base leading-relaxed">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
defineProps<{ question: string }>()
const isOpen = ref(false)
</script>
