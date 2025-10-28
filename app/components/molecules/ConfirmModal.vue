<template>
  <Transition
    enter-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-150"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      @click.self="handleCancel"
    >
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 scale-95 translate-y-2"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 translate-y-2"
      >
        <div
          v-if="modelValue"
          class="w-full max-w-md rounded-2xl bg-white shadow-xl"
        >
          <!-- Header -->
          <div class="flex items-center gap-3 border-b border-gray-200 px-6 py-4">
            <div
              class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
              :class="iconClasses"
            >
              <Icon :icon="iconName" class="h-5 w-5" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900">
              {{ title }}
            </h3>
          </div>

          <!-- Body -->
          <div class="px-6 py-5">
            <p class="text-sm leading-relaxed text-gray-600">
              {{ message }}
            </p>
          </div>

          <!-- Footer -->
          <div class="flex gap-3 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              @click="handleCancel"
              class="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Abbrechen
            </button>
            <button
              type="button"
              @click="handleConfirm"
              class="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
              :class="confirmButtonClasses"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

interface Props {
  modelValue: boolean
  title: string
  message: string
  confirmText?: string
  variant?: 'danger' | 'warning' | 'info'
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Bestätigen',
  variant: 'danger',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const handleConfirm = () => {
  emit('confirm')
  emit('update:modelValue', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}

const iconClasses = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'bg-red-100 text-red-600'
    case 'warning':
      return 'bg-yellow-100 text-yellow-600'
    case 'info':
      return 'bg-blue-100 text-blue-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
})

const iconName = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'ph:warning-duotone'
    case 'warning':
      return 'ph:alert-triangle-duotone'
    case 'info':
      return 'ph:info-duotone'
    default:
      return 'ph:question-duotone'
  }
})

const confirmButtonClasses = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    case 'warning':
      return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
    case 'info':
      return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    default:
      return 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
  }
})
</script>

