<template>
  <ProfilePanel title="Meine Beiträge" description="Deine letzten Aktivitäten in der Community.">
    <div v-if="posts.length" class="space-y-4">
      <article
        v-for="post in posts"
        :key="post.id"
        class="group rounded-2xl border border-black/5 bg-white/70 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <header class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 class="text-base font-semibold text-gray-900">{{ post.title || 'Beitrag ohne Titel' }}</h3>
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
              <Icon icon="ph:heart-duotone" class="h-4 w-4 text-rose-400" />
              {{ post.reactions }}
            </span>
            <span class="inline-flex items-center gap-1 text-gray-500">
              <Icon icon="ph:chat-centered-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
              {{ post.comments }}
            </span>
          </div>
        </header>

        <p class="mt-3 text-sm leading-relaxed text-gray-600 line-clamp-3">
          {{ post.excerpt }}
        </p>

        <!-- Inline-Erfassung / Bearbeitung der Laufdaten -->
        <section class="mt-4 rounded-xl bg-white/70 p-3 sm:p-4 border border-black/5">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            <div class="grow">
              <label class="block text-xs font-medium text-gray-600 mb-1">Kilometer</label>
              <input
                type="number"
                inputmode="decimal"
                min="0"
                step="0.1"
                class="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                :value="getEdit(post.id).km"
                @input="onKmInput(post.id, ($event.target as HTMLInputElement).value)"
                placeholder="z. B. 8.5"
              />
            </div>

            <div class="grow">
              <label class="block text-xs font-medium text-gray-600 mb-1">Zeit (hh:mm:ss)</label>
              <input
                type="text"
                pattern="^\\d{1,2}:\\d{2}(:\\d{2})?$"
                class="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                :value="getEdit(post.id).time"
                @input="onTimeInput(post.id, ($event.target as HTMLInputElement).value)"
                placeholder="z. B. 00:45:30"
              />
              <p v-if="getEdit(post.id).timeError" class="mt-1 text-xs text-red-500">
                Bitte im Format hh:mm oder hh:mm:ss eingeben.
              </p>
            </div>

            <div class="flex gap-2">
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-[var(--color-primary)] px-3 py-2 text-xs font-medium text-white hover:brightness-95 disabled:opacity-50"
                :disabled="!canSave(post.id)"
                @click="saveRun(post.id)"
                title="Laufdaten speichern"
              >
                <Icon icon="ph:check-circle-duotone" class="h-4 w-4" />
                Speichern
              </button>

              <button
                type="button"
                class="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                @click="resetEdit(post)"
                title="Zurücksetzen"
              >
                <Icon icon="ph:arrow-counter-clockwise-duotone" class="h-4 w-4" />
                Zurücksetzen
              </button>
            </div>
          </div>
        </section>

        <footer class="mt-4 flex items-center gap-3 text-xs text-gray-500">
          <button type="button" class="inline-flex items-center gap-1 text-[var(--color-accent)] hover:underline" @click="$emit('open', post.id)">
            <Icon icon="ph:arrow-square-out-duotone" class="h-4 w-4" />
            Öffnen
          </button>
          <button type="button" class="inline-flex items-center gap-1 hover:text-[var(--color-primary)]" @click="$emit('edit', post.id)">
            <Icon icon="ph:pencil-simple-line-duotone" class="h-4 w-4" />
            Bearbeiten
          </button>
          <button type="button" class="inline-flex items-center gap-1 hover:text-red-500" @click="$emit('delete', post.id)">
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
  </ProfilePanel>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { Icon } from '@iconify/vue'
import ProfilePanel from '../profile/ProfilePanel.vue'
import FormButton from '../atoms/form/FormButton.vue'

export type PostSummary = {
  id: string
  title: string
  excerpt: string
  createdAt: string | Date
  visibility: 'public' | 'protected' | 'private'
  reactions: number
  comments: number
  // Neu: optionale Laufdaten
  distanceInMeters?: number | null
  durationInSeconds?: number | null
}

const props = defineProps<{
  posts: PostSummary[]
}>()

const emit = defineEmits<{
  (e: 'open', id: string): void
  (e: 'edit', id: string): void
  (e: 'delete', id: string): void
  (e: 'compose'): void
  // Neu: Elternkomponente soll speichern (API-Aufruf machen)
  (e: 'save-run', payload: { id: string; distanceInMeters: number | null; durationInSeconds: number | null }): void
}>()

const mapVisibility = {
  public: 'Öffentlich',
  protected: 'Community',
  private: 'Privat',
} as const

const formatDate = (input: string | Date) =>
  new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(input))

const posts = computed(() =>
  props.posts.map((post) => ({
    ...post,
    visibilityLabel: mapVisibility[post.visibility],
  })),
)

/** Anzeige-Helfer */
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
  return [h, m, sec].map((v, i) => (i === 0 ? String(v).padStart(2, '0') : String(v).padStart(2, '0'))).join(':')
}

const hasRunData = (post: PostSummary) =>
  (post.distanceInMeters ?? null) !== null || (post.durationInSeconds ?? null) !== null

/** Edit-State pro Post (lokal im Card-Widget) */
type EditState = { km: string; time: string; timeError: boolean }
const editState = reactive<Record<string, EditState>>({})

const getEdit = (id: string): EditState => {
  if (!editState[id]) {
    // initial aus vorhandenen Werten der Props befüllen
    const p = props.posts.find((x) => x.id === id)
    const km = p?.distanceInMeters != null ? (p.distanceInMeters / 1000).toFixed(1) : ''
    const time = p?.durationInSeconds != null ? secToTime(p.durationInSeconds) : ''
    editState[id] = { km, time, timeError: false }
  }
  return editState[id]
}

const onKmInput = (id: string, val: string) => {
  getEdit(id).km = val
}

const onTimeInput = (id: string, val: string) => {
  const st = getEdit(id)
  st.time = val
  st.timeError = !isValidTime(val)
}

const canSave = (id: string) => {
  const st = getEdit(id)
  // Speichern erlauben, wenn entweder km oder time gesetzt und time-Format ok
  const hasAny = st.km.trim() !== '' || st.time.trim() !== ''
  return hasAny && !st.timeError
}

const resetEdit = (post: PostSummary) => {
  editState[post.id] = {
    km: post.distanceInMeters != null ? (post.distanceInMeters / 1000).toFixed(1) : '',
    time: post.durationInSeconds != null ? secToTime(post.durationInSeconds) : '',
    timeError: false,
  }
}

/** Konvertierungen */
function isValidTime(input: string) {
  if (!input) return true // leer ist erlaubt
  // akzeptiere hh:mm oder hh:mm:ss
  const m = input.match(/^(\d{1,2}):([0-5]\d)(?::([0-5]\d))?$/)
  return !!m
}

function timeToSec(input: string): number | null {
  if (!input) return null
  const m = input.match(/^(\d{1,2}):([0-5]\d)(?::([0-5]\d))?$/)
  if (!m) return null
  const h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  const s = m[3] ? parseInt(m[3], 10) : 0
  return h * 3600 + min * 60 + s
}

function secToTime(total: number): string {
  const s = Math.max(0, Math.floor(total))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

/** Speichern (Event für Parent) */
function saveRun(id: string) {
  const st = getEdit(id)

  // km -> meters
  let meters: number | null = null
  if (st.km.trim() !== '') {
    const km = Number(st.km.replace(',', '.'))
    meters = Number.isFinite(km) && km >= 0 ? Math.round(km * 1000) : null
  }

  // time -> seconds
  if (st.timeError) return
  const seconds = timeToSec(st.time)

  emit('save-run', {
    id,
    distanceInMeters: meters,
    durationInSeconds: seconds,
  })
}
</script>
