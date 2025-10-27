<template>
  <div class="px-4 py-12">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)] mb-2">
            Community Feed
          </p>
          <h1 class="mt-1 text-3xl font-semibold text-black mb-2">Alle Beiträge</h1>
          <p class="text-sm text-gray-600">
            Alle öffentlichen und Community-Postings auf einen Blick.
          </p>
        </div>
      </header>

      <div v-if="error" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ error }}
      </div>

      <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="n in 6" :key="n" class="h-60 animate-pulse rounded-3xl border border-black/5 bg-white/60"></div>
      </div>

      <div v-else-if="!posts.length" class="rounded-3xl border border-dashed border-black/10 bg-white/80 p-12 text-center shadow-sm">
        <p class="text-lg font-semibold text-gray-800">Noch keine Beiträge gefunden.</p>
        <p class="mt-2 text-sm text-gray-600">
          Sobald jemand einen Beitrag mit Community- oder Public-Sichtbarkeit erstellt, erscheint er hier.
        </p>
      </div>

      <section v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <PostingCardFeed
          v-for="post in posts"
          :key="post.id"
          :post="post"
          @reaction="handleReaction"
          @comment="handleComment"
        />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useCommunityFeed } from '@/composables/useCommunityFeed'
import PostingCardFeed from '@/components/cards/PostingCardFeed.vue'
import type { ReactionEmoji } from '@/constants/reactions'

const {
  posts,
  loading,
  error,
  loadFeed,
  toggleReaction,
  removeReaction,
  addComment,
} = useCommunityFeed()

// Optimized lookup with Map for O(1) access
const postsMap = computed(() => 
  new Map(posts.value?.map(p => [p.id, p]) || [])
)

onMounted(() => {
  loadFeed()
})

async function handleReaction(postId: string, emoji: ReactionEmoji) {
  const post = postsMap.value.get(postId)
  if (!post) return

  if (post.viewerReaction === emoji) {
    await removeReaction(postId)
  } else {
    await toggleReaction(postId, emoji)
  }
}

async function handleComment(postId: string, text: string) {
  try {
    await addComment(postId, text)
  } catch (error) {
    console.error('Kommentar konnte nicht gespeichert werden', error)
  }
}
</script>
