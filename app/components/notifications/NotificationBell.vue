<template>
  <div ref="wrapper" class="relative">
    <button type="button"
      class="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-primary-300 hover:text-primary-600"
      :aria-expanded="open ? 'true' : 'false'" aria-haspopup="true" @click="toggle">
      <span class="sr-only">Benachrichtigungen öffnen</span>
      <Icon icon="ph:bell" class="h-6 w-6" /> <span v-if="unreadCount > 0"
        class="absolute -top-1.5 -right-1.5 inline-flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full border border-white bg-[color:var(--color-primary)] px-1 text-[11px] font-semibold text-white shadow-md">
        {{ unreadCount }}
      </span>
    </button>

    <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-2">
      <div v-if="open" class="z-50 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur
          fixed inset-x-4 top-[5rem] max-h-[calc(100vh-6rem)] overflow-y-auto
          sm:inset-x-6 sm:max-h-[calc(100vh-7rem)]
          lg:absolute lg:left-auto lg:right-0 lg:top-full lg:mt-3 lg:max-h-none lg:w-[380px] lg:max-w-[380px] lg:overflow-visible
          xl:w-[400px] xl:max-w-[400px]">
        <header class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div>
            <p class="text-sm font-semibold text-slate-900">Benachrichtigungen</p>
            <p class="text-xs text-slate-500">Bleib über Team & Community auf dem Laufenden.</p>
          </div>
          <button type="button"
            class="self-start text-xs font-semibold text-primary-600 hover:text-primary-700 disabled:pointer-events-none disabled:text-slate-300 sm:self-auto"
            :disabled="!hasUnread" @click="handleMarkAll">
            Alle gelesen
          </button>
        </header>

        <div class="mt-4 flex flex-wrap gap-2">
          <button v-for="filter in filters" :key="filter.key" type="button"
            class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition"
            :class="[
              selectedCategory === filter.key
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
            ]" @click="handleCategory(filter.key)">
            <span>{{ filter.label }}</span>
            <span v-if="filter.unread > 0"
              class="inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full border border-white bg-[color:var(--color-primary)] px-1 text-[10px] font-bold text-white shadow">
              {{ filter.unread }}
            </span>
          </button>
        </div>

        <div class="mt-4 space-y-3 lg:max-h-[420px] lg:overflow-y-auto lg:pr-1">
          <div v-if="loading" class="py-10 text-center text-sm text-slate-500">Lade Benachrichtigungen …</div>
          <div v-else-if="error" class="py-10 text-center text-sm text-red-500">{{ error }}</div>
          <template v-else>
            <NotificationItem v-for="item in notifications" :key="item.id" :notification="item"
              :category-label="categoryLabels[item.category]" :category-color="categoryColors[item.category]"
              @mark-read="markAsRead" @approve="approveJoinRequest" @decline="declineJoinRequest" />
            <div v-if="!notifications.length" class="py-10 text-center text-sm text-slate-500">
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
const hasLoaded = ref(false)
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

async function ensureLoaded() {
  if (hasLoaded.value) return
  await loadNotifications(selectedCategory.value)
  hasLoaded.value = true
}

function handleCategory(category: NotificationFilterKey) {
  void setCategory(category)
}

async function handleMarkAll() {
  await markAllAsRead()
}

watch(open, async (value) => {
  if (value) {
    await ensureLoaded()
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
