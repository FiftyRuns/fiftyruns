<template>
  <ProfilePanel title="Meine Beiträge" description="Deine letzten Aktivitäten in der Community.">
    <div v-if="postsAugmented.length" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <PostingCardProfile
        v-for="post in postsAugmented"
        :key="post.id"
        :post="post"
        @edit="handleEdit"
        @delete="askDelete"
      />
    </div>

    <div v-else class="rounded-2xl border border-dashed border-black/10 bg-white/70 p-6 text-center text-sm text-gray-500">
      <Icon icon="ph:note-duotone" class="mx-auto mb-3 h-10 w-10 text-[var(--color-primary)]" />
      <p>Du hast noch keine Beiträge erstellt. Starte jetzt und teile deine ersten Laufmomente!</p>
      <FormButton class="mt-4" variant="primary" label="Beitrag erstellen" @click="$emit('compose')" />
    </div>

    <!-- Mini-Modal -->
    <div v-if="confirmOpen" class="fixed inset-0 z-[60] flex items-center justify-center">
      <div class="absolute inset-0 bg-black/30" @click="closeConfirm"></div>
      <div class="relative z-[61] w-[90%] max-w-sm rounded-2xl border border-black/10 bg-white p-5 shadow-xl">
        <h3 class="text-base font-semibold text-black">Beitrag löschen?</h3>
        <p class="mt-2 text-sm text-gray-600">
          Bist du sicher, dass du diesen Beitrag endgültig löschen möchtest? Dieser Vorgang kann nicht rückgängig gemacht werden.
        </p>
        <div class="mt-4 flex justify-end gap-2">
          <button type="button" class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
                  @click="closeConfirm">
            Abbrechen
          </button>
          <button type="button" class="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
                  @click="confirmDelete">
            Ja, löschen
          </button>
        </div>
      </div>
    </div>
  </ProfilePanel>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import ProfilePanel from './ProfilePanel.vue'
import FormButton from '../atoms/form/FormButton.vue'
import PostingCardProfile from '../cards/PostingCardProfile.vue'

export type PostSummary = {
  id: string
  title: string
  content: string
  createdAt: string | Date
  visibility: 'public' | 'protected' | 'private'
  reactions: number
  comments: number
  distanceInMeters?: number | null
  durationInSeconds?: number | null
  image?: string | null
}

const props = defineProps<{ posts: PostSummary[] }>()

const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'confirm-delete', id: string): void 
  (e: 'compose'): void
}>()

const mapVisibility = { public: 'Öffentlich', protected: 'Community', private: 'Privat' } as const

const postsAugmented = computed(() =>
  props.posts.map((post) => ({ ...post, visibilityLabel: mapVisibility[post.visibility] })),
)

/* Modal-Logik */
const confirmOpen = ref(false)
const pendingDeleteId = ref<string | null>(null)

function handleEdit(id: string) {
  emit('edit', id)
}

function askDelete(id: string) {
  pendingDeleteId.value = id
  confirmOpen.value = true
}

function closeConfirm() {
  confirmOpen.value = false
  pendingDeleteId.value = null
}

function confirmDelete() {
  if (pendingDeleteId.value) {
    emit('confirm-delete', pendingDeleteId.value)
    closeConfirm()
  }
}
</script>
