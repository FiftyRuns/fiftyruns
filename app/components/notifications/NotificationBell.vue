<template>
  <div ref="wrapper" class="relative">
    <button
      type="button"
      class="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-[var(--color-primary)] transition hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5"
      :aria-expanded="open ? 'true' : 'false'"
      aria-haspopup="true"
      @click="toggle"
    >
      <span class="sr-only">Benachrichtigungen öffnen</span>
      <Icon icon="ph:bell-duotone" class="h-5 w-5" />
      <span
        v-if="unreadCount > 0"
        class="absolute -right-1.5 -top-1.5 inline-flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-[var(--color-primary)] px-1 text-[11px] font-semibold text-white shadow-md"
      >
        {{ unreadCount }}
      </span>
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="open"
        class="z-50 rounded-3xl border border-black/5 bg-white/95 p-4 shadow-xl backdrop-blur
          fixed inset-x-4 top-[5rem] max-h-[calc(100vh-6rem)] overflow-y-auto
          sm:inset-x-6 sm:max-h-[calc(100vh-7rem)]
          lg:absolute lg:left-auto lg:right-0 lg:top-full lg:mt-3 lg:max-h-none lg:w-[400px] lg:max-w-[400px] lg:overflow-visible"
      >
        <header class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div>
            <p class="text-sm font-semibold text-black">Benachrichtigungen</p>
            <p class="text-xs text-gray-500">Bleib über Team &amp; Community auf dem Laufenden.</p>
          </div>
          <button
            type="button"
            class="self-start text-xs font-semibold text-[var(--color-primary)] hover:opacity-80 disabled:pointer-events-none disabled:text-gray-300 sm:self-auto"
            :disabled="!hasUnread"
            @click="handleMarkAll"
          >
            Alle gelesen
          </button>
        </header>

        <div class="mt-4 flex flex-wrap gap-2">
          <button
            v-for="filter in filters"
            :key="filter.key"
            type="button"
            class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition"
            :class="[
              selectedCategory === filter.key
                ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                : 'border-black/10 bg-white text-gray-600 hover:border-black/20',
            ]"
            @click="handleCategory(filter.key)"
          >
            <span>{{ filter.label }}</span>
            <span
              v-if="filter.unread > 0"
              class="inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-bold text-white"
            >
              {{ filter.unread }}
            </span>
          </button>
        </div>

        <div class="mt-4 space-y-2 lg:max-h-[440px] lg:overflow-y-auto lg:pr-1">
          <div v-if="loading" class="py-10 text-center text-sm text-gray-500">Lade Benachrichtigungen …</div>
          <div v-else-if="error" class="py-10 text-center text-sm text-red-500">{{ error }}</div>
          <template v-else>
            <NotificationItem
              v-for="item in notifications"
              :key="item.id"
              :notification="item"
              :category-label="categoryLabels[item.category]"
              :category-color="categoryColors[item.category]"
              @mark-read="markAsRead"
              @approve="approveJoinRequest"
              @decline="declineJoinRequest"
            />
            <div v-if="!notifications.length" class="py-10 text-center text-sm text-gray-500">
              Keine Benachrichtigungen vorhanden.
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import NotificationItem from './NotificationItem.vue'
import { useNotifications } from '@/composables/useNotifications'
import type { NotificationFilterKey } from '@/types/notifications'

const {
  notifications,
  loading,
  error,
  filters,
  unreadCount,
  hasUnread,
  selectedCategory,
  categoryLabels,
  categoryColors,
  loadNotifications,
  setCategory,
  markAsRead,
  markAllAsRead,
  approveJoinRequest,
  declineJoinRequest,
} = useNotifications()

const open = ref(false)
const wrapper = ref<HTMLElement | null>(null)

const handleOutsideClick = (event: MouseEvent) => {
  const target = event.target as Node | null
  if (!open.value || !target) return
  if (wrapper.value?.contains(target)) return
  open.value = false
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && open.value) {
    open.value = false
  }
}

function toggle() {
  open.value = !open.value
}

function handleCategory(category: NotificationFilterKey) {
  void setCategory(category)
}

async function handleMarkAll() {
  await markAllAsRead()
}

watch(open, async (value) => {
  if (value) {
    await loadNotifications(selectedCategory.value)
  }
})

onMounted(() => {
  document.addEventListener('click', handleOutsideClick, true)
  document.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick, true)
  document.removeEventListener('keydown', handleKeyDown)
})
</script>
