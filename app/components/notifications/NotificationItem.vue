<template>
  <article
    :class="[
      'rounded-xl border px-3 py-3 transition duration-150',
      notification.isRead
        ? 'border-slate-200 bg-white hover:border-slate-300'
        : 'border-primary-200/70 bg-primary-50/60 hover:border-primary-300',
    ]"
  >
    <div class="flex items-start gap-3">
      <div class="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold uppercase text-slate-600">
        <span>{{ categoryLabel.charAt(0) }}</span>
      </div>
      <div class="flex-1">
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1">
            <span :class="['inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold', categoryColor]">
              {{ categoryLabel }}
            </span>
            <p class="text-sm font-semibold text-slate-900">{{ notification.title }}</p>
            <p class="text-sm text-slate-600">
              {{ notification.message }}
            </p>
          </div>
          <span class="shrink-0 text-xs font-medium text-slate-400">{{ relativeTime }}</span>
        </div>

        <p v-if="postingPreview" class="mt-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500">
          {{ postingPreview }}
        </p>

        <p v-if="commentPreview" class="mt-2 rounded-md bg-emerald-50/60 px-3 py-2 text-xs italic text-emerald-700">
          „{{ commentPreview }}“
        </p>

        <div v-if="hasRunStats" class="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
          <span v-if="distanceLabel">
            Distanz: <span class="font-semibold text-slate-800">{{ distanceLabel }}</span>
          </span>
          <span v-if="durationLabel">
            Zeit: <span class="font-semibold text-slate-800">{{ durationLabel }}</span>
          </span>
        </div>

        <div v-if="isJoinRequestPending" class="mt-3 space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p class="text-sm font-semibold text-amber-900">
            {{ joinRequestPayload?.requester?.name }} möchte dem Team {{ joinRequestPayload?.group?.name }} beitreten.
          </p>
          <p v-if="joinRequestPayload?.message" class="rounded-md bg-white/80 px-3 py-2 text-xs text-amber-800">
            „{{ joinRequestPayload.message }}“
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
              @click="emit('decline', joinRequestPayload)"
            >
              Ablehnen
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
              @click="emit('approve', joinRequestPayload)"
            >
              Bestätigen
            </button>
          </div>
        </div>

        <p v-else-if="joinRequestPayload" class="mt-2 text-xs text-slate-500">
          Anfrage-Status:
          <span class="font-semibold">
            {{ joinRequestStatusLabel }}
          </span>
          <span v-if="joinRequestPayload.decidedAt">
            — {{ formatDate(joinRequestPayload.decidedAt) }}
          </span>
        </p>

        <div class="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <button
            v-if="!notification.isRead"
            type="button"
            class="font-medium text-primary-600 hover:text-primary-700"
            @click="emit('mark-read', notification.id)"
          >
            Als gelesen markieren
          </button>
          <NuxtLink
            v-if="notification.link"
            :to="notification.link"
            class="inline-flex items-center gap-1 font-medium text-primary-600 hover:text-primary-700"
          >
            Ansehen
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NotificationRecord, TeamJoinRequestActionPayload } from '@/types/notifications'

const props = defineProps<{
  notification: NotificationRecord
  categoryLabel: string
  categoryColor: string
}>()

const emit = defineEmits<{
  (e: 'mark-read', id: string): void
  (e: 'approve', payload: TeamJoinRequestActionPayload | null): void
  (e: 'decline', payload: TeamJoinRequestActionPayload | null): void
}>()

const data = computed(() => props.notification.data ?? {})

const commentPreview = computed(() => {
  const value = (data.value as Record<string, unknown>)['commentPreview']
  return typeof value === 'string' ? value.trim() : ''
})

const postingPreview = computed(() => {
  const value = (data.value as Record<string, unknown>)['postingPreview']
  return typeof value === 'string' ? value.trim() : ''
})

const distanceLabel = computed(() => {
  const value = (data.value as Record<string, unknown>)['distanceLabel']
  return typeof value === 'string' ? value : ''
})

const durationLabel = computed(() => {
  const value = (data.value as Record<string, unknown>)['durationLabel']
  return typeof value === 'string' ? value : ''
})

const hasRunStats = computed(() => Boolean(distanceLabel.value || durationLabel.value))

const joinRequestPayload = computed<TeamJoinRequestActionPayload | null>(() => {
  if (props.notification.action?.type !== 'TEAM_JOIN_REQUEST') return null
  const payload = props.notification.action.payload
  if (!payload) return null
  return payload
})

const isJoinRequestPending = computed(
  () => joinRequestPayload.value?.status === 'PENDING',
)

const joinRequestStatusLabel = computed(() => {
  switch (joinRequestPayload.value?.status) {
    case 'APPROVED':
      return 'Bestätigt'
    case 'DECLINED':
      return 'Abgelehnt'
    default:
      return 'Offen'
  }
})

const relativeTime = computed(() => formatTimeAgo(props.notification.createdAt))

function formatTimeAgo(iso: string) {
  const date = new Date(iso)
  const diff = Date.now() - date.getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'Gerade eben'
  if (minutes < 60) return `${minutes} Min.`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} Std.`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} T.`
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
  })
}

function formatDate(iso?: string) {
  if (!iso) return ''
  const date = new Date(iso)
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
  })
}
</script>
