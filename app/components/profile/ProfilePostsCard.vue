<template>
  <ProfilePanel title="Meine Beiträge" description="Deine letzten Aktivitäten in der Community.">
    <div v-if="postsAugmented.length" class="space-y-4">
      <article
        v-for="post in postsAugmented"
        :key="post.id"
        class="group rounded-2xl border border-[var(--color-accent)]/15 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <header class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 class="text-base font-semibold text-black">
              {{ post.title || 'Beitrag ohne Titel' }}
            </h3>
            <p class="text-xs text-gray-500">
              {{ formatDate(post.createdAt) }} · {{ post.visibilityLabel }}
            </p>
          </div>

          <div class="flex items-center gap-3 text-xs text-gray-600">
            <!-- Laufdaten (Anzeige) -->
            <template v-if="hasRunData(post)">
              <span class="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white/80 px-2 py-1">
                <Icon icon="ph:road-horizon-duotone" class="h-4 w-4" />
                {{ formatDistance(post.distanceInMeters) }}
              </span>
              <span class="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white/80 px-2 py-1">
                <Icon icon="ph:timer-duotone" class="h-4 w-4" />
                {{ formatDuration(post.durationInSeconds) }}
              </span>
            </template>

            <!-- Reaktionen / Kommentare -->
            <span class="inline-flex items-center gap-1 text-gray-500">
              <Icon icon="ph:heart-duotone" class="h-4 w-4 text-[var(--color-accent)]" />
              {{ post.reactions }}
            </span>
            <span class="inline-flex items-center gap-1 text-gray-500">
              <Icon icon="ph:chat-centered-duotone" class="h-4 w-4 text-[var(--color-accent)]/80" />
              {{ post.comments }}
            </span>
          </div>
        </header>

        <div v-if="post.image" class="mt-3">
          <figure class="overflow-hidden rounded-xl bg-gray-100">
            <NuxtImg
              :src="post.image"
              :alt="post.title ? `Bild zu ${post.title}` : 'Bild zum Beitrag'"
              width="800"
              height="450"
              sizes="(min-width: 1024px) 33vw, 100vw"
              class="h-56 w-full object-cover sm:h-64 md:h-72"
              format="webp"
              loading="lazy"
            />
          </figure>
        </div>

        <footer class="mt-4 flex items-center gap-3 text-xs text-gray-500">
          <button
            type="button"
            class="inline-flex items-center gap-1 hover:text-[var(--color-primary)]"
            @click="$emit('edit', post.id)"
            title="Beitrag bearbeiten"
          >
            <Icon icon="ph:pencil-simple-line-duotone" class="h-4 w-4" />
            Bearbeiten
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-1 hover:text-red-500"
            @click="askDelete(post.id)"
            title="Beitrag löschen"
          >
            <Icon icon="ph:trash-duotone" class="h-4 w-4" />
            Löschen
          </button>
        </footer>
      </article>
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

const formatDate = (input: string | Date) =>
  new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(input))

const postsAugmented = computed(() =>
  props.posts.map((post) => ({ ...post, visibilityLabel: mapVisibility[post.visibility] })),
)

const hasRunData = (post: PostSummary) =>
  (post.distanceInMeters ?? null) !== null || (post.durationInSeconds ?? null) !== null

const formatDistance = (meters?: number | null) => {
  if (meters == null) return '– km'
  const km = meters / 1000
  return `${km.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`
}
const formatDuration = (seconds?: number | null) => {
  if (seconds == null) return '–:–'
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return [h, m, sec].map((v) => String(v).padStart(2, '0')).join(':')
}

/* Modal-Logik */
const confirmOpen = ref(false)
const pendingDeleteId = ref<string | null>(null)

function askDelete(id: string) {
  pendingDeleteId.value = id
  confirmOpen.value = true
}
function closeConfirm() {
  confirmOpen.value = false
  pendingDeleteId.value = null
}
function confirmDelete() {
  if (pendingDeleteId.value) emit('confirm-delete', pendingDeleteId.value)
  closeConfirm()
}
</script>
