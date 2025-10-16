<template>
  <div
    ref="containerRef"
    class="relative my-16 flex justify-center gap-8 overflow-hidden"
    :style="{
      '--td-color': resolvedColor,
      '--td-size-min': sizeMin,          // z.B. 1.125rem
      '--td-size-max': sizeMax,          // z.B. 3rem
      '--td-size-vw': sizeVw,            // z.B. 4vw
      '--dir': direction === 'right' ? 'scrollRight' : 'scrollLeft'
    }"
    aria-hidden="true"
  >
    <div
      v-for="(_, index) in repeatedTexts"
      :key="index"
      class="scroll-text font-extrabold tracking-tight whitespace-nowrap will-change-transform"
      :class="extraTextClasses"                      
      :style="{
        animationDelay: `${index * animationDelay}s`,
        animationDuration: `${speed}s`
      }"
      :data-visible="isVisible"
    >
      {{ text }}
    </div>

    <!-- Edge fade -->
    <div class="pointer-events-none absolute inset-0"
         style="mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
                -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);">
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  text?: string
  repeat?: number
  animationDelay?: number
  speed?: number
  textColor?: string                
  direction?: 'left' | 'right'
  sizeMin?: string                   
  sizeMax?: string                   
  sizeVw?: string                    
  extraTextClasses?: string        
}

const props = defineProps<Props>()

// Defaults
const text = props.text ?? '#50runs'
const repeat = props.repeat ?? 4
const animationDelay = props.animationDelay ?? 0.6
const speed = props.speed ?? 6
const direction = props.direction ?? 'left'

const resolvedColor = computed(() =>
  (props.textColor && props.textColor.trim()) || 'var(--accent, #a2c92d)'
)

// Fluid-Defaults (schönes Spektrum)
const sizeMin = props.sizeMin ?? '1.125rem'  // ~18px
const sizeMax = props.sizeMax ?? '3rem'      // 48px
const sizeVw  = props.sizeVw  ?? '4vw'       // Anteil vom Viewport
const extraTextClasses = props.extraTextClasses ?? '' // optional

const repeatedTexts = computed(() => Array.from({ length: repeat }, () => text))

const containerRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
let observer: IntersectionObserver | null = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          isVisible.value = true
          if (containerRef.value) observer?.unobserve(containerRef.value)
        }
      })
    },
    { threshold: 0.2 }
  )
  if (containerRef.value) observer.observe(containerRef.value)
})

onUnmounted(() => {
  if (observer && containerRef.value) observer.unobserve(containerRef.value)
})
</script>

<style scoped>
.scroll-text {
  color: var(--td-color);
  font-size: clamp(var(--td-size-min), var(--td-size-vw), var(--td-size-max));

  opacity: 0;
  animation-name: var(--dir, scrollLeft);
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  animation-play-state: paused;

  text-shadow:
    0 1px 0 rgba(0,0,0,.06),
    0 2px 8px rgba(0,0,0,.06);

  transform: translateZ(0);
  transition: opacity .45s ease;
}

.scroll-text[data-visible="true"] {
  opacity: 1;
  animation-play-state: running;
}

@keyframes scrollLeft {
  0%   { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}
@keyframes scrollRight {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@media (prefers-reduced-motion: reduce) {
  .scroll-text { opacity: 1 !important; }
}
</style>
