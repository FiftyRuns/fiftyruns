<template>
  <ConfirmModal
    v-model="showDeleteModal"
    title="Kommentar löschen?"
    message="Möchtest du diesen Kommentar wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
    confirm-text="Löschen"
    variant="danger"
    @confirm="handleDeleteConfirm"
  />
  <PostingCard
    :content="post.text"
    :image="post.image"
    :image-alt="`Bild von ${post.author.name}`"
    :distance-in-meters="post.runningExercise.distanceInMeters"
    :duration-in-seconds="post.runningExercise.durationInSeconds"
    :show-run-data="true"
  >
    <template #header>
      <div class="flex items-center gap-3 p-4">
        <NuxtLink
          :to="`/profile/${encodeURIComponent(post.author.nameId)}`"
          class="flex items-center gap-3 hover:text-[var(--color-accent)]"
        >
          <span class="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-black/10 bg-gray-100">
            <NuxtImg
              v-if="post.author.image"
              :src="post.author.image"
              :alt="`Profilbild von ${post.author.name}`"
              class="h-full w-full object-cover"
              width="40"
              height="40"
              loading="lazy"
              sizes="40px"
            />
            <span v-else class="grid h-full w-full place-items-center text-xs font-semibold uppercase text-[var(--color-primary)]">
              {{ authorInitials }}
            </span>
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-black">
              {{ post.author.name }}
            </p>
            <p class="text-xs text-gray-500">{{ formattedDate }}</p>
          </div>
        </NuxtLink>
        <span class="shrink-0 inline-flex h-7 items-center rounded-full border border-black/10 bg-gray-50 px-2.5 text-[10px] font-medium uppercase tracking-wide text-gray-600">
          {{ visibilityLabel(post.visibility) }}
        </span>
      </div>
    </template>

    <template #footer>
      <div class="p-4">
        <!-- Reactions -->
        <div class="mb-3 flex flex-wrap items-center gap-1.5">
          <button
            v-for="reaction in post.reactions"
            :key="reaction.emoji"
            type="button"
            class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition"
            :class="post.viewerReaction === reaction.emoji ? 'bg-[var(--color-accent)]/20 text-[var(--color-primary)]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            @click="handleReaction(reaction.emoji)"
          >
            <span class="text-base leading-none">{{ reaction.emoji }}</span>
            <span class="tabular-nums">{{ reaction.count }}</span>
          </button>
        </div>

        <!-- Comments -->
        <details class="group">
          <summary class="cursor-pointer text-xs font-semibold text-gray-700 hover:text-gray-900 flex items-center justify-between list-none">
            <span>Kommentare ({{ post.comments.length }})</span>
            <Icon icon="ph:caret-down" class="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
          </summary>
          <div class="mt-3 space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="comment in post.comments"
              :key="comment.id"
              class="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2"
            >
              <div class="flex items-start gap-2">
                <NuxtLink
                  :to="`/profile/${encodeURIComponent(comment.author.nameId)}`"
                  class="mt-0.5 h-7 w-7 shrink-0 overflow-hidden rounded-full border border-black/5 bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-primary)]"
                >
                  <NuxtImg
                    v-if="comment.author.image"
                    :src="comment.author.image"
                    :alt="`Profilbild von ${comment.author.name}`"
                    class="h-full w-full object-cover"
                    width="28"
                    height="28"
                    loading="lazy"
                    sizes="28px"
                  />
                  <span v-else class="grid h-full w-full place-items-center text-[10px] font-semibold uppercase text-[var(--color-primary)]">
                    {{ initials(comment.author.name) }}
                  </span>
                </NuxtLink>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 text-[10px] text-gray-500">
                      <NuxtLink
                        :to="`/profile/${encodeURIComponent(comment.author.nameId)}`"
                        class="font-medium text-gray-700 hover:text-[var(--color-primary)] truncate"
                      >
                        {{ comment.author.name }}
                      </NuxtLink>
                      <span>{{ new Date(comment.createdAt).toLocaleDateString('de-DE') }}</span>
                    </div>
                    <div v-if="isOwnComment(comment)" class="flex items-center gap-1">
                      <button
                        type="button"
                        @click="startEdit(comment)"
                        class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Kommentar bearbeiten"
                      >
                        <Icon icon="ph:pencil-simple-duotone" class="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        @click="confirmDelete(comment.id)"
                        class="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        aria-label="Kommentar löschen"
                      >
                        <Icon icon="ph:trash-duotone" class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div v-if="editingCommentId === comment.id" class="mt-2">
                    <textarea
                      v-model="editCommentText"
                      rows="2"
                      class="w-full rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-800 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    ></textarea>
                    <div class="mt-1.5 flex gap-1.5">
                      <button
                        type="button"
                        @click="saveEdit(comment.id)"
                        class="rounded px-2 py-1 text-[10px] font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 transition-colors"
                      >
                        Speichern
                      </button>
                      <button
                        type="button"
                        @click="cancelEdit"
                        class="rounded px-2 py-1 text-[10px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                  <p v-else class="mt-0.5 whitespace-pre-line text-xs text-gray-700">{{ comment.text }}</p>
                </div>
              </div>
            </div>

            <form v-if="isLoggedIn" class="mt-2" @submit.prevent="submitComment">
              <textarea
                id="comment-textarea"
                name="comment"
                v-model="commentText"
                rows="2"
                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                placeholder="Kommentar schreiben..."
              ></textarea>
              <button
                type="submit"
                class="mt-1.5 w-full rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-[var(--color-primary)]/90 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="commentPending"
              >
                {{ commentPending ? 'Wird gesendet...' : 'Senden' }}
              </button>
              <p v-if="commentError" class="mt-1 text-[10px] text-red-600">{{ commentError }}</p>
            </form>
            <p v-else class="text-xs text-gray-500">Anmelden um zu kommentieren</p>
          </div>
        </details>
      </div>
    </template>
  </PostingCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useAuthUser } from '@/composables/useAuthUser'
import PostingCard from './PostingCard.vue'
import ConfirmModal from '@/components/molecules/ConfirmModal.vue'
import type { CommunityPost } from '@/composables/useCommunityFeed'
import type { ReactionEmoji } from '@/constants/reactions'

// Cached formatters outside component
const dateFormatter = new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' })

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '•'
}

const props = defineProps<{
  post: CommunityPost
}>()

const emit = defineEmits<{
  reaction: [postId: string, emoji: ReactionEmoji]
  comment: [postId: string, text: string]
  'edit-comment': [postId: string, commentId: string, text: string]
  'delete-comment': [postId: string, commentId: string]
}>()

const authUser = useAuthUser()
const isLoggedIn = computed(() => Boolean(authUser.value))
const commentText = ref('')
const commentPending = ref(false)
const commentError = ref('')
const editingCommentId = ref<string | null>(null)
const editCommentText = ref('')
const deletingCommentId = ref<string | null>(null)
const showDeleteModal = ref(false)

const isOwnComment = (comment: CommunityPost['comments'][0]) => {
  return comment.author.id === authUser.value?.id
}

// Computed properties for performance
const formattedDate = computed(() => dateFormatter.format(new Date(props.post.createdAt)))
const authorInitials = computed(() => initials(props.post.author.name))

function visibilityLabel(visibility: 'public' | 'protected') {
  return visibility === 'public' ? 'Öffentlich' : 'Community'
}

function handleReaction(emoji: ReactionEmoji) {
  emit('reaction', props.post.id, emoji)
}

async function submitComment() {
  const text = commentText.value.trim()
  if (!text) {
    commentError.value = 'Kommentar darf nicht leer sein.'
    return
  }

  commentError.value = ''
  commentPending.value = true

  try {
    emit('comment', props.post.id, text)
    commentText.value = ''
  } catch (error) {
    commentError.value = 'Kommentar konnte nicht gesendet werden.'
  } finally {
    commentPending.value = false
  }
}

function startEdit(comment: CommunityPost['comments'][0]) {
  editingCommentId.value = comment.id
  editCommentText.value = comment.text
}

function cancelEdit() {
  editingCommentId.value = null
  editCommentText.value = ''
}

function saveEdit(commentId: string) {
  const text = editCommentText.value.trim()
  if (!text) return
  emit('edit-comment', props.post.id, commentId, text)
  editingCommentId.value = null
  editCommentText.value = ''
}

function confirmDelete(commentId: string) {
  deletingCommentId.value = commentId
  showDeleteModal.value = true
}

function handleDeleteConfirm() {
  if (deletingCommentId.value) {
    emit('delete-comment', props.post.id, deletingCommentId.value)
    deletingCommentId.value = null
  }
}
</script>

