import { computed, ref } from 'vue'
import { useCookie } from 'nuxt/app'
import type {
  NotificationCategory,
  NotificationFilter,
  NotificationFilterKey,
  NotificationRecord,
  TeamJoinRequestActionPayload,
} from '@/types/notifications'

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  REACTION: 'Reaktionen',
  COMMENT: 'Kommentare',
  TEAM: 'Team',
  RUN: 'Statistiken',
  SYSTEM: 'System',
  INTEGRATION: 'Integrationen',
}

const CATEGORY_COLORS: Record<NotificationCategory, string> = {
  REACTION: 'bg-blue-100 text-blue-700',
  COMMENT: 'bg-emerald-100 text-emerald-700',
  TEAM: 'bg-amber-100 text-amber-800',
  RUN: 'bg-violet-100 text-violet-700',
  SYSTEM: 'bg-slate-100 text-slate-700',
  INTEGRATION: 'bg-rose-100 text-rose-700',
}

type CategoryTotals = Record<NotificationCategory, { total: number; unread: number }>

type NotificationResponse = {
  items: NotificationRecord[]
  unreadCount: number
  totals: Record<string, number>
  unreadTotals: Record<string, number>
}

const notificationsState = ref<NotificationRecord[]>([])
const loadingState = ref(false)
const errorState = ref('')
const unreadCountState = ref(0)
const selectedCategoryState = ref<NotificationFilterKey>('ALL')
const totalsState = ref<CategoryTotals>({
  REACTION: { total: 0, unread: 0 },
  COMMENT: { total: 0, unread: 0 },
  TEAM: { total: 0, unread: 0 },
  RUN: { total: 0, unread: 0 },
  SYSTEM: { total: 0, unread: 0 },
  INTEGRATION: { total: 0, unread: 0 },
})

export function useNotifications() {
  const csrfCookie = useCookie<string | null>('csrf_token', { default: () => null })

  function applyTotals(payload: NotificationResponse) {
    const nextTotals: CategoryTotals = {
      REACTION: { total: 0, unread: 0 },
      COMMENT: { total: 0, unread: 0 },
      TEAM: { total: 0, unread: 0 },
      RUN: { total: 0, unread: 0 },
      SYSTEM: { total: 0, unread: 0 },
      INTEGRATION: { total: 0, unread: 0 },
    }

    for (const category of Object.keys(nextTotals) as NotificationCategory[]) {
      nextTotals[category] = {
        total: payload.totals[category] ?? 0,
        unread: payload.unreadTotals[category] ?? 0,
      }
    }

    totalsState.value = nextTotals
    unreadCountState.value = payload.unreadCount
  }

  async function loadNotifications(category: NotificationFilterKey = selectedCategoryState.value) {
    loadingState.value = true
    errorState.value = ''
    try {
      const query = category !== 'ALL' ? { category } : undefined
      const data = await $fetch<NotificationResponse>('/api/notifications', {
        credentials: 'include',
        query,
      })

      notificationsState.value = data.items
      selectedCategoryState.value = category
      applyTotals(data)
    } catch (error) {
      if (process.dev) {
        console.error('[useNotifications] Benachrichtigungen konnten nicht geladen werden', error)
      }
      errorState.value = 'Benachrichtigungen konnten nicht geladen werden.'
    } finally {
      loadingState.value = false
    }
  }

  async function markAsRead(id: string) {
    const notification = notificationsState.value.find((entry) => entry.id === id)
    if (!notification || notification.isRead) return

    const csrf = csrfCookie.value ?? ''
    try {
      await $fetch<{ ok: true; unreadCount: number }>('/api/notifications/mark-read', {
        method: 'POST',
        body: { ids: [id] },
        headers: { 'x-csrf-token': csrf },
        credentials: 'include',
      })

      notification.isRead = true
      unreadCountState.value = Math.max(0, unreadCountState.value - 1)
      const totals = totalsState.value[notification.category]
      if (totals) {
        totals.unread = Math.max(0, totals.unread - 1)
      }
    } catch (error) {
      if (process.dev) {
        console.error('[useNotifications] Benachrichtigung konnte nicht aktualisiert werden', error)
      }
    }
  }

  async function markAllAsRead() {
    if (!notificationsState.value.some((entry) => !entry.isRead)) return

    const csrf = csrfCookie.value ?? ''
    try {
      await $fetch<{ ok: true; unreadCount: number }>('/api/notifications/mark-all', {
        method: 'POST',
        headers: { 'x-csrf-token': csrf },
        credentials: 'include',
      })

      notificationsState.value = notificationsState.value.map((entry) => ({
        ...entry,
        isRead: true,
      }))
      unreadCountState.value = 0
      for (const category of Object.keys(totalsState.value) as NotificationCategory[]) {
        totalsState.value[category].unread = 0
      }
    } catch (error) {
      if (process.dev) {
        console.error('[useNotifications] Alle Benachrichtigungen konnten nicht aktualisiert werden', error)
      }
    }
  }

  async function approveJoinRequest(payload: TeamJoinRequestActionPayload | null) {
    if (!payload?.requestId) return

    const csrf = csrfCookie.value ?? ''
    try {
      await $fetch(`/api/team/requests/${payload.requestId}/approve`, {
        method: 'POST',
        headers: { 'x-csrf-token': csrf },
        credentials: 'include',
      })
    } catch (error) {
      if (process.dev) {
        console.error('[useNotifications] Anfrage konnte nicht bestätigt werden', error)
      }
      throw error
    }
    await loadNotifications(selectedCategoryState.value)
  }

  async function declineJoinRequest(payload: TeamJoinRequestActionPayload | null) {
    if (!payload?.requestId) return

    const csrf = csrfCookie.value ?? ''
    try {
      await $fetch(`/api/team/requests/${payload.requestId}/decline`, {
        method: 'POST',
        headers: { 'x-csrf-token': csrf },
        credentials: 'include',
      })
    } catch (error) {
      if (process.dev) {
        console.error('[useNotifications] Anfrage konnte nicht abgelehnt werden', error)
      }
      throw error
    }
    await loadNotifications(selectedCategoryState.value)
  }

  function setCategory(category: NotificationFilterKey) {
    selectedCategoryState.value = category
    return loadNotifications(category)
  }

  const filters = computed<NotificationFilter[]>(() => {
    const perCategory = (Object.keys(totalsState.value) as NotificationCategory[]).map((category) => ({
      key: category as NotificationFilterKey,
      label: CATEGORY_LABELS[category],
      unread: totalsState.value[category].unread,
      total: totalsState.value[category].total,
    }))

    const allTotal = perCategory.reduce((sum, entry) => sum + entry.total, 0)

    return [
      {
        key: 'ALL',
        label: 'Alle',
        unread: unreadCountState.value,
        total: allTotal,
      },
      ...perCategory,
    ]
  })

  const hasUnread = computed(() => unreadCountState.value > 0)

  return {
    notifications: notificationsState,
    loading: loadingState,
    error: errorState,
    filters,
    unreadCount: unreadCountState,
    hasUnread,
    selectedCategory: selectedCategoryState,
    categoryLabels: CATEGORY_LABELS,
    categoryColors: CATEGORY_COLORS,
    loadNotifications,
    setCategory,
    markAsRead,
    markAllAsRead,
    approveJoinRequest,
    declineJoinRequest,
  }
}
