<template>
  <div class="px-4 py-24">
    <div class="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header class="flex flex-col gap-2 text-center sm:text-left">
        <h1 class="text-3xl font-bold text-gray-900">Community-Beiträge</h1>
        <p class="text-gray-600">
          Alle öffentlichen und Community-Postings auf einen Blick. Reagiere mit Emojis oder lass einen Kommentar da.
        </p>
      </header>

      <div v-if="error" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ error }}
      </div>

      <div v-if="loading" class="grid gap-4">
        <div v-for="n in 3" :key="n" class="h-48 animate-pulse rounded-3xl border border-black/5 bg-white/70"></div>
      </div>

      <div v-else-if="!posts.length" class="rounded-3xl border border-dashed border-black/10 bg-white/80 p-10 text-center shadow-sm">
        <p class="text-lg font-medium text-gray-800">Noch keine Beiträge sichtbar.</p>
        <p class="mt-2 text-sm text-gray-600">
          Sobald jemand einen Beitrag mit Community- oder Public-Sichtbarkeit erstellt, erscheint er hier.
        </p>
      </div>

      <section v-else class="space-y-6">
        <article
          v-for="post in posts"
          :key="post.id"
          class="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg"
        >
          <header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex items-center gap-4">
              <span class="relative h-12 w-12 overflow-hidden rounded-full border border-black/10 bg-gray-100">
                <NuxtImg
                  v-if="post.author.image"
                  :src="post.author.image"
                  :alt="`Profilbild von ${post.author.name}`"
                  class="h-full w-full object-cover"
                  width="48"
                  height="48"
                />
                <span
                  v-else
                  class="grid h-full w-full place-items-center text-base font-semibold uppercase text-[var(--color-primary)]"
                >
                  {{ initials(post.author.name) }}
                </span>
              </span>
              <div>
                <p class="text-base font-semibold text-gray-900">
                  {{ post.author.name }}
                </p>
                <p class="text-xs text-gray-500">{{ formatDate(post.createdAt) }}</p>
              </div>
            </div>

            <span
              class="inline-flex h-8 items-center justify-center rounded-full border border-black/10 bg-gray-50 px-3 text-xs font-medium uppercase tracking-wide text-gray-600"
            >
              {{ visibilityLabel(post.visibility) }}
            </span>
          </header>

          <div v-if="hasRunData(post)" class="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-700">
            <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
              <Icon icon="ph:road-horizon-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
              {{ formatDistance(post.runningExercise.distanceInMeters) }}
            </span>
            <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
              <Icon icon="ph:timer-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
              {{ formatDuration(post.runningExercise.durationInSeconds) }}
            </span>
          </div>

          <p v-if="post.text" class="mt-4 whitespace-pre-line text-base leading-relaxed text-gray-800">
            {{ post.text }}
          </p>

          <div v-if="post.image" class="mt-4 overflow-hidden rounded-2xl">
            <NuxtImg
              :src="post.image"
              :alt="`Bild von ${post.author.name}`"
              width="960"
              height="540"
              class="h-64 w-full object-cover"
              sizes="(min-width: 1024px) 40vw, 100vw"
              format="webp"
            />
          </div>

          <div class="mt-6 flex flex-wrap items-center gap-2">
            <button
              v-for="reaction in post.reactions"
              :key="reaction.emoji"
              type="button"
              class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm transition"
              :class="post.viewerReaction === reaction.emoji ? 'bg-[var(--color-accent)]/20 text-[var(--color-primary)]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              @click="handleReaction(post.id, reaction.emoji)"
            >
              <span class="text-lg leading-none">{{ reaction.emoji }}</span>
              <span class="tabular-nums">{{ reaction.count }}</span>
            </button>
            <button
              v-if="post.viewerReaction"
              type="button"
              class="ml-auto inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              @click="handleReaction(post.id, post.viewerReaction)"
            >
              <Icon icon="ph:x-circle-duotone" class="h-4 w-4" />
              Reaktion entfernen
            </button>
          </div>

          <section class="mt-6 space-y-4">
            <h3 class="text-sm font-semibold text-gray-800">
              Kommentare <span class="ml-1 text-xs font-normal text-gray-500">({{ post.comments.length }})</span>
            </h3>

            <ul class="space-y-3">
              <li
                v-for="comment in post.comments"
                :key="comment.id"
                class="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3"
              >
                <div class="flex items-start gap-3">
                  <span class="mt-1 h-8 w-8 shrink-0 overflow-hidden rounded-full border border-black/5 bg-white">
                    <NuxtImg
                      v-if="comment.author.image"
                      :src="comment.author.image"
                      :alt="`Profilbild von ${comment.author.name}`"
                      class="h-full w-full object-cover"
                      width="32"
                      height="32"
                    />
                    <span
                      v-else
                      class="grid h-full w-full place-items-center text-xs font-semibold uppercase text-[var(--color-primary)]"
                    >
                      {{ initials(comment.author.name) }}
                    </span>
                  </span>
                  <div class="flex-1">
                    <div class="flex items-center justify-between text-xs text-gray-500">
                      <span class="font-medium text-gray-700">{{ comment.author.name }}</span>
                      <span>{{ formatDate(comment.createdAt) }}</span>
                    </div>
                    <p class="mt-1 text-sm text-gray-700">{{ comment.text }}</p>
                  </div>
                </div>
              </li>
            </ul>

            <form class="space-y-3" @submit.prevent="submitComment(post.id)">
              <textarea
                v-model="commentTexts[post.id]"
                rows="2"
                class="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                placeholder="Was möchtest du sagen?"
              ></textarea>
              <div class="flex items-center gap-3">
                <button
                  type="submit"
                  class="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[var(--color-primary)]/90 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="commentPending[post.id]"
                >
                  Kommentar senden
                </button>
                <p v-if="commentErrors[post.id]" class="text-xs text-red-600">{{ commentErrors[post.id] }}</p>
              </div>
            </form>
          </section>
        </article>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useCommunityFeed } from '@/composables/useCommunityFeed'
import type { CommunityPost } from '@/composables/useCommunityFeed'
import type { ReactionEmoji } from '@/constants/reactions'

const { posts, loading, error, loadFeed, toggleReaction, removeReaction, addComment } = useCommunityFeed()

const commentTexts = reactive<Record<string, string>>({})
const commentPending = reactive<Record<string, boolean>>({})
const commentErrors = reactive<Record<string, string>>({})

onMounted(() => {
  loadFeed()
})

watch(
  posts,
  (list) => {
    for (const post of list) {
      if (!(post.id in commentTexts)) commentTexts[post.id] = ''
      if (!(post.id in commentPending)) commentPending[post.id] = false
      if (!(post.id in commentErrors)) commentErrors[post.id] = ''
    }
  },
  { immediate: true },
)

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}

function formatDistance(meters: number | null) {
  if (meters == null) return '–'
  const km = meters / 1000
  return `${km.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`
}

function formatDuration(seconds: number | null) {
  if (seconds == null) return '–:–'
  const value = Math.max(0, Math.floor(seconds))
  const h = Math.floor(value / 3600)
  const m = Math.floor((value % 3600) / 60)
  const s = value % 60
  return [h, m, s].map((unit) => String(unit).padStart(2, '0')).join(':')
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function visibilityLabel(visibility: 'public' | 'protected') {
  return visibility === 'public' ? 'Öffentlich' : 'Community'
}

function hasRunData(post: CommunityPost) {
  const distance = post.runningExercise.distanceInMeters
  const duration = post.runningExercise.durationInSeconds
  return distance != null || duration != null
}

async function handleReaction(postId: string, emoji: ReactionEmoji) {
  const post = posts.value.find((entry) => entry.id === postId)
  if (!post) return

  if (post.viewerReaction === emoji) {
    await removeReaction(postId)
  } else {
    await toggleReaction(postId, emoji)
  }
}

async function submitComment(postId: string) {
  const text = commentTexts[postId] ?? ''

  if (!text.trim()) {
    commentErrors[postId] = 'Kommentar darf nicht leer sein.'
    return
  }

  commentErrors[postId] = ''
  commentPending[postId] = true

  try {
    await addComment(postId, text)
    commentTexts[postId] = ''
  } catch (error) {
    console.error(error)
    commentErrors[postId] = 'Kommentar konnte nicht gespeichert werden.'
  } finally {
    commentPending[postId] = false
  }
}
</script>
