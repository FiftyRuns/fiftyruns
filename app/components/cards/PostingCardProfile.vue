<template>
  <PostingCard
    :content="post.content"
    :image="post.image"
    :image-alt="post.title ? `Bild zu ${post.title}` : 'Bild zum Beitrag'"
    :distance-in-meters="post.distanceInMeters"
    :duration-in-seconds="post.durationInSeconds"
    :show-run-data="true"
  >
    <template #header>
      <div class="flex items-center justify-between p-4">
        <div class="flex items-center gap-2 text-xs text-gray-500">
          <span>{{ formattedDate }}</span>
          <span>·</span>
          <span class="inline-flex h-6 items-center rounded-full border border-black/10 bg-gray-50 px-2 text-[10px] font-medium uppercase tracking-wide text-gray-600">
            {{ post.visibilityLabel }}
          </span>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="p-4">
        <!-- Stats -->
        <div class="mb-3 flex flex-wrap items-center gap-1.5">
          <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
            <Icon icon="ph:heart-duotone" class="h-3.5 w-3.5 text-[var(--color-accent)]" />
            <span class="tabular-nums">{{ post.reactions }}</span>
          </span>
          <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
            <Icon icon="ph:chat-centered-duotone" class="h-3.5 w-3.5 text-[var(--color-accent)]/80" />
            <span class="tabular-nums">{{ post.comments }}</span>
          </span>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-black/10 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
            @click="handleEdit"
            title="Beitrag bearbeiten"
          >
            <Icon icon="ph:pencil-simple-line-duotone" class="h-4 w-4" />
            Bearbeiten
          </button>

          <button
            type="button"
            class="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
            @click="handleDelete"
            title="Beitrag löschen"
          >
            <Icon icon="ph:trash-duotone" class="h-4 w-4" />
            Löschen
          </button>
        </div>
      </div>
    </template>
  </PostingCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import PostingCard from './PostingCard.vue'

type PostSummaryWithLabel = {
  id: string
  title: string
  content: string
  createdAt: string | Date
  visibility: 'public' | 'protected' | 'private'
  visibilityLabel: string
  reactions: number
  comments: number
  distanceInMeters?: number | null
  durationInSeconds?: number | null
  image?: string | null
}

// Cached formatters outside component
const dateFormatter = new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' })

const props = defineProps<{
  post: PostSummaryWithLabel
}>()

const emit = defineEmits<{
  edit: [id: string]
  delete: [id: string]
}>()

const formattedDate = computed(() => dateFormatter.format(new Date(props.post.createdAt)))

function handleEdit() {
  emit('edit', props.post.id)
}

function handleDelete() {
  emit('delete', props.post.id)
}
</script>

