import { ref, computed } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  message: string
  type: ToastType
  duration: number
  progress: number
}

let toastIdCounter = 0

const toasts = ref<Toast[]>([])

const DEFAULT_DURATION = {
  success: 3000,
  error: 5000,
  info: 3000,
  warning: 5000,
}

export const useToast = () => {
  const addToast = (message: string, type: ToastType = 'info', customDuration?: number) => {
    const toast: Toast = {
      id: ++toastIdCounter,
      message,
      type,
      duration: customDuration ?? DEFAULT_DURATION[type],
      progress: 100,
    }

    toasts.value.push(toast)

    // Auto-dismiss
    const startTime = Date.now()
    const duration = toast.duration

    const updateProgress = () => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      
      const toastIndex = toasts.value.findIndex((t) => t.id === toast.id)
      if (toastIndex !== -1) {
        toasts.value[toastIndex].progress = remaining
        
        if (remaining <= 0) {
          removeToast(toast.id)
        } else {
          requestAnimationFrame(updateProgress)
        }
      }
    }

    requestAnimationFrame(updateProgress)
  }

  const removeToast = (id: number) => {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  const showSuccess = (message: string, duration?: number) => addToast(message, 'success', duration)
  const showError = (message: string, duration?: number) => addToast(message, 'error', duration)
  const showInfo = (message: string, duration?: number) => addToast(message, 'info', duration)
  const showWarning = (message: string, duration?: number) => addToast(message, 'warning', duration)

  return {
    toasts: computed(() => toasts.value),
    showSuccess,
    showError,
    showInfo,
    showWarning,
    removeToast,
  }
}

