<template>
  <Panel
    title="Meine Läufe"
    description="Bild, Distanz, Zeit, Text – mit Reactions & Kommentaren."
    :bleed="true"
  >
    <div class="space-y-6">
      <div
        v-for="post in posts"
        :key="post.id"
        class="rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm"
      >
        <!-- Bild -->
        <img
          v-if="post.image"
          :src="post.image"
          alt="Laufbild"
          class="mb-3 h-56 w-full rounded-xl object-cover"
        />

        <!-- Distanz & Zeit -->
        <div class="flex flex-wrap items-center gap-3 text-sm text-gray-700">
          <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
            🏃 {{ (post.distanceInMeters / 1000).toFixed(1) }} km
          </span>
          <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
            ⏱️ {{ formatDuration(post.durationInSeconds) }}
          </span>
        </div>

        <!-- Text -->
        <p v-if="post.text" class="mt-3 text-gray-800 whitespace-pre-line">
          {{ post.text }}
        </p>

        <!-- Reactions & Kommentare -->
        <div class="mt-4 flex items-center gap-4 text-sm text-gray-600">
          <button
            type="button"
            class="inline-flex items-center gap-1 hover:text-rose-500"
            @click="$emit('open-reactions', post.id)"
            title="Reaktionen ansehen"
          >
            ❤️ <span class="tabular-nums">{{ post.reactions }}</span>
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1 hover:text-[var(--color-primary)]"
            @click="$emit('open-comments', post.id)"
            title="Kommentare ansehen"
          >
            💬 <span class="tabular-nums">{{ post.comments }}</span>
          </button>
          <span class="ml-auto text-xs text-gray-400">
            {{ new Date(post.createdAt).toLocaleDateString('de-DE') }}
          </span>
        </div>
      </div>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Panel from './ProfilePanel.vue'
defineOptions({ name: 'UserPostsList' }) 

export interface Post {
  id: string
  createdAt: string
  text: string | null
  image: string | null
  distanceInMeters: number
  durationInSeconds: number
  reactions: number
  comments: number
}

const posts = ref<Post[]>([])

onMounted(async () => {
  const res = await fetch('/api/profile/posts', { credentials: 'include' })
  if (res.ok) posts.value = await res.json()
})

function formatDuration(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':')
}
</script>
