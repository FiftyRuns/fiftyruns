<template>
  <article
    :class="[
      'rounded-2xl border px-3 py-3 transition duration-150',
      notification.isRead
        ? 'border-black/5 bg-white/80 hover:border-black/10'
        : 'border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 hover:border-[var(--color-primary)]/30',
    ]"
  >
    <div class="flex items-start gap-3">
      <div class="relative mt-0.5 shrink-0">
        <div
          v-if="actorAvatar"
          class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)]/10 text-xs font-semibold text-[var(--color-primary)]"
        >
          <NuxtImg
            v-if="actorAvatar.image"
            :src="actorAvatar.image"
            :alt="actorAvatar.name"
            class="h-9 w-9 rounded-full object-cover"
            width="72"
            height="72"
            format="webp"
          />
          <span v-else>{{ actorAvatar.name.slice(0, 2).toUpperCase() }}</span>
        </div>
        <div
          v-else
          class="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
        >
          <Icon :icon="categoryIcon" class="h-4 w-4" />
        </div>
        <span
          v-if="reactionEmoji"
          class="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-white text-[13px] leading-none"
        >{{ reactionEmoji }}</span>
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0 space-y-0.5">
            <span :class="['inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold', categoryColor]">
              {{ categoryLabel }}
            </span>
            <p class="text-sm font-semibold text-black">{{ notification.title }}</p>
            <p class="text-sm text-gray-600">{{ notification.message }}</p>
          </div>
          <span class="shrink-0 text-xs font-medium text-gray-400">{{ relativeTime }}</span>
        </div>

        <p v-if="postingPreview" class="mt-2 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-500">
          {{ postingPreview }}
        </p>

        <p v-if="commentPreview" class="mt-2 rounded-xl bg-[var(--color-primary)]/5 px-3 py-2 text-xs italic text-[var(--color-primary)]">
          „{{ commentPreview }}"
        </p>

        <div v-if="hasRunStats" class="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
          <span v-if="distanceLabel">
            Distanz: <span class="font-semibold text-black">{{ distanceLabel }}</span>
          </span>
          <span v-if="durationLabel">
            Zeit: <span class="font-semibold text-black">{{ durationLabel }}</span>
          </span>
        </div>

        <div v-if="isJoinRequestPending" class="mt-3 space-y-3 rounded-xl border border-black/10 bg-gray-50 p-3">
          <p class="text-sm font-semibold text-black">
            {{ joinRequestPayload?.requester?.name }} möchte dem Team {{ joinRequestPayload?.group?.name }} beitreten.
          </p>
          <p v-if="joinRequestPayload?.message" class="rounded-lg bg-white/80 px-3 py-2 text-xs text-gray-700">
            „{{ joinRequestPayload.message }}"
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-black/5"
              @click="emit('decline', joinRequestPayload)"
            >
              Ablehnen
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-primary)]/90"
              @click="emit('approve', joinRequestPayload)"
            >
              Bestätigen
            </button>
          </div>
        </div>

        <p v-else-if="joinRequestPayload" class="mt-2 text-xs text-gray-500">
          Anfrage-Status:
          <span class="font-semibold text-black">{{ joinRequestStatusLabel }}</span>
          <span v-if="joinRequestPayload.decidedAt"> — {{ formatDate(joinRequestPayload.decidedAt) }}</span>
        </p>

        <div class="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <button
            v-if="!notification.isRead"
            type="button"
            class="font-medium text-[var(--color-primary)] hover:opacity-80"
            @click="emit('mark-read', notification.id)"
          >
            Als gelesen markieren
          </button>
          <NuxtLink
            v-if="notification.link"
            :to="notification.link"
            class="inline-flex items-center gap-1 font-medium text-[var(--color-primary)] hover:opacity-80"
          >
            Ansehen
            <Icon icon="ph:arrow-right" class="h-3.5 w-3.5" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
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

const CATEGORY_ICONS: Record<string, string> = {
  REACTION: 'ph:heart-duotone',
  COMMENT: 'ph:chat-circle-dots-duotone',
  TEAM: 'ph:users-three-duotone',
  RUN: 'ph:sneaker-move-duotone',
  SYSTEM: 'ph:info-duotone',
  INTEGRATION: 'ph:plug-duotone',
}

const data = computed(() => props.notification.data ?? {})

const actorAvatar = computed(() => {
  const actor = (data.value as Record<string, unknown>)['actor']
  if (!actor || typeof actor !== 'object') return null
  const a = actor as { id?: string; name?: string; image?: string | null }
  if (!a.name) return null
  return { id: a.id ?? '', name: a.name, image: a.image ?? null }
})

const reactionEmoji = computed(() => {
  if (props.notification.category !== 'REACTION') return ''
  const value = (data.value as Record<string, unknown>)['emoji']
  return typeof value === 'string' ? value : ''
})

const categoryIcon = computed(() => CATEGORY_ICONS[props.notification.category] ?? 'ph:bell-duotone')

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

const isJoinRequestPending = computed(() => joinRequestPayload.value?.status === 'PENDING')

const joinRequestStatusLabel = computed(() => {
  switch (joinRequestPayload.value?.status) {
    case 'APPROVED': return 'Bestätigt'
    case 'DECLINED': return 'Abgelehnt'
    default: return 'Offen'
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
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
}

function formatDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
}
</script>
