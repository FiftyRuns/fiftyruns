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
        <button
          v-if="authUser"
          type="button"
          class="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          @click="showComposer = true"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Beitrag erstellen
        </button>
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
          @edit-comment="handleEditComment"
          @delete-comment="handleDeleteComment"
        />
      </section>
    </div>
  </div>

  <!-- Post-Composer Modal -->
  <Teleport to="body">
    <div
      v-if="showComposer"
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-24 backdrop-blur-sm"
      @click.self="showComposer = false"
    >
      <div class="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <div class="flex items-center justify-between border-b border-black/5 px-6 py-4">
          <h2 class="text-lg font-semibold text-black">Neuen Beitrag erstellen</h2>
          <button
            type="button"
            class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            @click="showComposer = false"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="p-6">
          <ProfilePostComposer
            :model-value="composerForm"
            :loading="composerState.loading"
            :error-message="composerState.error"
            :success-message="composerState.success"
            @update:model-value="onComposerUpdate"
            @submit="handleComposerSubmit"
            @open-media-library="() => {}"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useCommunityFeed } from '@/composables/useCommunityFeed'
import { useAuthUser } from '@/composables/useAuthUser'
import { useToast } from '@/composables/useToast'
import PostingCardFeed from '@/components/cards/PostingCardFeed.vue'
import ProfilePostComposer from '@/components/profile/ProfilePostComposer.vue'
import type { PostComposerForm, PostComposerSubmitPayload } from '@/components/profile/ProfilePostComposer.vue'
import type { ReactionEmoji } from '@/constants/reactions'

const authUser = useAuthUser()
const { showSuccess, showError } = useToast()

const {
  posts,
  loading,
  error,
  loadFeed,
  toggleReaction,
  removeReaction,
  addComment,
  updateComment,
  deleteComment,
} = useCommunityFeed()

// Optimized lookup with Map for O(1) access
const postsMap = computed(() =>
  new Map(posts.value?.map(p => [p.id, p]) || [])
)

onMounted(() => {
  loadFeed()
})

// ── Composer Modal ────────────────────────────────────────────────────────────

const showComposer = ref(false)

const composerForm = reactive<PostComposerForm>({
  title: '',
  content: '',
  visibility: 'public',
  distanceKm: '',
  duration: '',
  garminActivityId: '',
  createdAt: new Date().toISOString(),
})

const composerState = reactive({ loading: false, error: '', success: '' })

function onComposerUpdate(val: PostComposerForm) {
  Object.assign(composerForm, val)
}

async function handleComposerSubmit(form: PostComposerSubmitPayload & { imageUrl?: string | null }) {
  composerState.loading = true
  composerState.error = ''
  composerState.success = ''
  try {
    if (form.distanceInMeters == null || form.durationInSeconds == null) {
      throw new Error('Bitte Distanz und Zeit eingeben.')
    }
    const csrf = useCookie('csrf_token').value
    await $fetch('/api/profile/posts', {
      method: 'POST',
      headers: { 'x-csrf-token': csrf ?? '' },
      body: {
        content: form.content,
        visibility: form.visibility,
        image: form.imageUrl ?? null,
        distanceInMeters: Math.round(form.distanceInMeters),
        durationInSeconds: Math.round(form.durationInSeconds),
        garminActivityId: form.garminActivityId || null,
      },
      credentials: 'include',
    })
    composerForm.title = composerForm.content = composerForm.distanceKm = composerForm.duration = ''
    showComposer.value = false
    showSuccess('Beitrag erfolgreich veröffentlicht!')
    await loadFeed()
  } catch (err: any) {
    composerState.error = err?.data?.message || err?.message || 'Fehler beim Speichern.'
    showError(composerState.error)
  } finally {
    composerState.loading = false
  }
}

// ── Feed Reactions & Comments ─────────────────────────────────────────────────

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
    if (process.dev) {
      console.error('[postings] Kommentar konnte nicht gespeichert werden', error)
    }
  }
}

async function handleEditComment(postId: string, commentId: string, text: string) {
  try {
    await updateComment(postId, commentId, text)
  } catch (error) {
    if (process.dev) {
      console.error('[postings] Kommentar konnte nicht aktualisiert werden', error)
    }
  }
}

async function handleDeleteComment(postId: string, commentId: string) {
  try {
    await deleteComment(postId, commentId)
  } catch (error) {
    if (process.dev) {
      console.error('[postings] Kommentar konnte nicht gelöscht werden', error)
    }
  }
}
</script>
