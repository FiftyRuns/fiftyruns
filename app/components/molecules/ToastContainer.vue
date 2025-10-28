<template>
  <div
    class="pointer-events-none fixed z-50 w-full px-4 sm:right-0 sm:w-auto"
    style="top: 80px;"
  >
    <div class="flex flex-col gap-3 sm:items-end">
      <Toast
        v-for="toast in toasts"
        :key="toast.id"
        :toast="toast"
        @close="removeToast"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import Toast from '@/components/atoms/Toast.vue'

const { toasts, removeToast } = useToast()
</script>

