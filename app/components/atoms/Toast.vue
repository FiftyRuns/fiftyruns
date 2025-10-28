<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="translate-x-full opacity-0"
    enter-to-class="translate-x-0 opacity-100"
    leave-active-class="transition-all duration-250 ease-in"
    leave-from-class="translate-x-0 opacity-100"
    leave-to-class="translate-x-full opacity-0"
  >
    <div
      v-if="visible"
      class="relative min-w-[300px] max-w-[400px] overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/5"
      :class="toastClasses"
    >
      <!-- Progress Bar -->
      <div
        class="absolute bottom-0 left-0 h-1 bg-current opacity-20 transition-all duration-100"
        :style="{ width: `${toast.progress}%` }"
      />

      <!-- Content -->
      <div class="flex items-start gap-3 p-4">
        <!-- Icon -->
        <div class="flex-shrink-0" :class="iconClasses">
          <Icon :icon="iconName" class="h-5 w-5" />
        </div>

        <!-- Message -->
        <p class="flex-1 text-sm font-medium leading-relaxed text-gray-900">
          {{ toast.message }}
        </p>

        <!-- Close Button -->
        <button
          type="button"
          @click="handleClose"
          class="flex-shrink-0 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label="Toast schließen"
        >
          <Icon icon="ph:x" class="h-4 w-4" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import type { Toast } from '@/composables/useToast'

const props = defineProps<{
  toast: Toast
}>()

const emit = defineEmits<{
  close: [id: number]
}>()

const visible = ref(false)

const handleClose = () => {
  visible.value = false
  setTimeout(() => emit('close', props.toast.id), 250)
}

onMounted(() => {
  visible.value = true
})

const toastClasses = computed(() => {
  const base = 'border-l-4'
  switch (props.toast.type) {
    case 'success':
      return `${base} border-green-500`
    case 'error':
      return `${base} border-red-500`
    case 'warning':
      return `${base} border-yellow-500`
    case 'info':
      return `${base} border-blue-500`
    default:
      return `${base} border-gray-500`
  }
})

const iconClasses = computed(() => {
  switch (props.toast.type) {
    case 'success':
      return 'text-green-600'
    case 'error':
      return 'text-red-600'
    case 'warning':
      return 'text-yellow-600'
    case 'info':
      return 'text-blue-600'
    default:
      return 'text-gray-600'
  }
})

const iconName = computed(() => {
  switch (props.toast.type) {
    case 'success':
      return 'ph:check-circle-duotone'
    case 'error':
      return 'ph:x-circle-duotone'
    case 'warning':
      return 'ph:warning-duotone'
    case 'info':
      return 'ph:info-duotone'
    default:
      return 'ph:circle-duotone'
  }
})
</script>

