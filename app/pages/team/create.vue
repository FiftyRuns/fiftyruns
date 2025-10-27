<template>
  <div class="px-4 py-12">
    <div class="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header class="flex flex-col gap-3">
        <NuxtLink to="/profile" class="text-sm text-[var(--color-primary)] underline-offset-2 hover:underline">
          ← Zurück zum Profil
        </NuxtLink>
        <h1 class="text-3xl font-semibold text-black">Eigenes Team gründen</h1>
        <p class="text-sm text-gray-600">
          Richte dein Team Schritt für Schritt ein. Du kannst später jederzeit Anpassungen vornehmen.
        </p>
      </header>

      <nav aria-label="Fortschritt" class="rounded-3xl border border-black/5 bg-white/80 p-6 shadow-sm">
        <ol class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <li v-for="(step, index) in steps" :key="step.id" class="flex items-center gap-3">
            <span
              class="grid h-8 w-8 place-items-center rounded-full text-sm font-semibold"
              :class="stepStatus(index)"
            >
              {{ index + 1 }}
            </span>
            <div>
              <p class="text-sm font-semibold text-black">{{ step.title }}</p>
              <p class="text-xs text-gray-500">{{ step.description }}</p>
            </div>
          </li>
        </ol>
      </nav>

      <div v-if="stepError" class="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ stepError }}
      </div>

      <section v-if="currentStepId === 'details'" class="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm">
        <header class="mb-6">
          <h2 class="text-xl font-semibold text-black">Basisdaten</h2>
          <p class="text-sm text-gray-600">
            Wähle einen Teamnamen und erzähle der Community, worum es bei euch geht.
          </p>
        </header>

        <div class="grid gap-6">
          <div>
            <label for="team-name" class="mb-2 block text-sm font-semibold text-gray-800">Teamname *</label>
            <input
              id="team-name"
              v-model.trim="form.name"
              type="text"
              maxlength="80"
              placeholder="z. B. Berlin Runners"
              class="w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm text-gray-700 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            />
          </div>

          <div>
            <label for="team-slug" class="mb-2 block text-sm font-semibold text-gray-800">
              Öffentlicher Link
            </label>
            <div class="flex items-center gap-2 rounded-2xl border border-black/10 bg-white/90 px-4 py-3">
              <span class="text-sm text-gray-500">/team/</span>
              <input
                id="team-slug"
                v-model="form.slug"
                type="text"
                maxlength="60"
                @input="onSlugInput"
                class="w-full border-0 bg-transparent text-sm text-gray-700 outline-none focus:outline-none"
              />
            </div>
            <p class="mt-1 text-xs text-gray-500">
              Dieser Link führt zu deiner Teamseite. Du kannst ihn später nicht ohne Weiteres ändern.
            </p>
          </div>

          <div>
            <label for="team-description" class="mb-2 block text-sm font-semibold text-gray-800">
              Beschreibung / Leitmotiv
            </label>
            <textarea
              id="team-description"
              v-model.trim="form.description"
              rows="5"
              maxlength="600"
              placeholder="Beschreibe euer Ziel, euren Vibe und was neue Mitglieder erwartet."
              class="w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm text-gray-700 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            />
            <p class="mt-1 text-xs text-gray-400">{{ form.description.length }}/600 Zeichen</p>
          </div>
        </div>
      </section>

      <section v-else-if="currentStepId === 'identity'" class="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm">
        <header class="mb-6">
          <h2 class="text-xl font-semibold text-black">Visuelles Profil</h2>
          <p class="text-sm text-gray-600">
            Lade ein quadratisches Titelbild hoch. Du kannst es zuschneiden und positionieren.
          </p>
        </header>

        <div class="grid gap-6 md:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
          <div>
            <div
              class="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl border border-dashed border-black/10 bg-gray-100"
              @pointerdown="onCoverPointerDown"
              @pointerup="onCoverPointerUp"
              @pointerleave="onCoverPointerUp"
            >
              <template v-if="cover.preview">
                <img
                  ref="coverImageRef"
                  :src="cover.preview"
                  alt="Teamcover Vorschau"
                  class="absolute left-1/2 top-1/2 h-auto w-auto select-none"
                  draggable="false"
                  :style="coverImageStyle"
                />
                <div
                  v-if="cover.isDragging"
                  class="absolute inset-0 bg-black/10"
                />
              </template>
              <div
                v-else
                class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-gray-400"
              >
                <Icon icon="ph:image-duotone" class="h-10 w-10" />
                <span class="text-xs">Ein quadratisches Bild (JPEG/PNG) hochladen</span>
              </div>

              <input
                ref="coverInputRef"
                type="file"
                accept="image/*"
                class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                @change="onCoverSelect"
              />
            </div>
            <div v-if="cover.preview" class="mt-4 flex flex-col gap-2">
              <label for="cover-zoom" class="text-xs font-medium text-gray-600">Zoom</label>
              <input
                id="cover-zoom"
                v-model.number="cover.zoom"
                type="range"
                min="1"
                max="3"
                step="0.01"
                class="w-full accent-[var(--color-primary)]"
              />
              <p class="text-xs text-gray-500">Ziehe das Bild im Ausschnitt, um es zu positionieren.</p>
              <button type="button" class="self-start text-xs text-red-500 underline-offset-2 hover:underline" @click="resetCover">
                Bild entfernen
              </button>
            </div>
          </div>

          <div class="space-y-4 rounded-2xl border border-black/5 bg-white/70 p-5 text-sm text-gray-600">
            <p class="font-semibold text-black">Tipps für ein gutes Cover</p>
            <ul class="space-y-2 text-xs text-gray-600">
              <li class="flex items-start gap-2">
                <Icon icon="ph:check-circle-duotone" class="mt-0.5 h-4 w-4 text-[var(--color-primary)]" />
                Quadratisches Motiv mit klaren Farben wählen.
              </li>
              <li class="flex items-start gap-2">
                <Icon icon="ph:check-circle-duotone" class="mt-0.5 h-4 w-4 text-[var(--color-primary)]" />
                Logos oder Grafiken mittig platzieren.
              </li>
              <li class="flex items-start gap-2">
                <Icon icon="ph:check-circle-duotone" class="mt-0.5 h-4 w-4 text-[var(--color-primary)]" />
                Max. 8 MB, Formate: JPG, PNG, WebP, AVIF.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section v-else-if="currentStepId === 'membership'" class="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm">
        <header class="mb-6">
          <h2 class="text-xl font-semibold text-black">Mitgliedschaft &amp; Regeln</h2>
          <p class="text-sm text-gray-600">
            Bestimme, wer das Team findet und wie Beitritte funktionieren.
          </p>
        </header>

        <div class="grid gap-6">
          <fieldset class="space-y-3">
            <legend class="text-sm font-semibold text-gray-800">Sichtbarkeit *</legend>
            <div
              v-for="option in visibilityOptions"
              :key="option.value"
              class="flex items-start gap-3 rounded-2xl border border-black/5 bg-white/80 px-4 py-3"
            >
              <input
                :id="`visibility-${option.value}`"
                v-model="form.visibility"
                :value="option.value"
                type="radio"
                class="mt-1 h-4 w-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <label :for="`visibility-${option.value}`" class="flex-1">
                <span class="block text-sm font-semibold text-black">{{ option.label }}</span>
                <span class="mt-1 block text-xs text-gray-600">{{ option.description }}</span>
              </label>
            </div>
          </fieldset>

          <div class="flex flex-col gap-2">
            <label class="flex items-center gap-3 text-sm font-semibold text-gray-800">
              <input
                v-model="form.requireApproval"
                type="checkbox"
                class="h-4 w-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                :disabled="form.visibility !== 'public'"
              />
              Beitrittsanfragen müssen bestätigt werden
            </label>
            <p class="text-xs text-gray-500">
              Wenn deaktiviert, treten Interessierte direkt bei (nur verfügbar bei öffentlichen Teams).
            </p>
          </div>

          <div>
            <label for="max-members" class="mb-2 block text-sm font-semibold text-gray-800">Max. Teamgröße</label>
            <div class="flex items-center gap-2">
              <input
                id="max-members"
                v-model="form.maxMembers"
                type="number"
                min="2"
                max="500"
                placeholder="unbegrenzt"
                class="w-40 rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm text-gray-700 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
              />
              <span class="text-xs text-gray-500">Optional – lasse frei für unbegrenzt.</span>
            </div>
          </div>
        </div>
      </section>

      <section v-else-if="currentStepId === 'invites'" class="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm">
        <header class="mb-6">
          <h2 class="text-xl font-semibold text-black">Mitglieder einladen</h2>
          <p class="text-sm text-gray-600">
            Lade Freund:innen direkt ein oder trage E-Mail-Adressen ein. Einladungen kannst du später weiter verwalten.
          </p>
        </header>

        <div class="grid gap-6 md:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
          <div class="space-y-6">
            <div>
              <h3 class="text-sm font-semibold text-black">Nutzer:innen suchen</h3>
              <div
                class="mt-2 flex items-center gap-2 rounded-2xl border border-black/10 bg-white/90 px-4 py-3 focus-within:ring-2 focus-within:ring-[var(--color-primary)]/30"
              >
                <Icon icon="ph:magnifying-glass-duotone" class="h-5 w-5 text-[var(--color-primary)]" />
                <input
                  v-model="searchTerm"
                  type="search"
                  placeholder="Name, Username oder E-Mail"
                  class="w-full border-0 bg-transparent text-sm text-gray-700 outline-none focus:outline-none"
                />
              </div>
              <div v-if="searchPending" class="mt-3 text-xs text-gray-500">Suche läuft…</div>
              <ul v-else-if="searchResults.length" class="mt-3 space-y-2 text-sm text-gray-700">
                <li
                  v-for="user in searchResults"
                  :key="user.id"
                  class="flex items-center justify-between rounded-2xl border border-black/5 bg-white/70 px-3 py-2"
                >
                  <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-xs font-semibold text-[var(--color-primary)]">
                      <NuxtImg
                        v-if="user.image"
                        :src="user.image"
                        :alt="user.name"
                        class="h-10 w-10 rounded-full object-cover"
                        width="72"
                        height="72"
                        format="webp"
                      />
                      <span v-else>{{ user.name.slice(0, 2).toUpperCase() }}</span>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-black">{{ user.name }}</p>
                      <p class="text-xs text-gray-500">@{{ user.nameId }} · {{ user.email }}</p>
                    </div>
                  </div>
                  <FormButton
                    variant="ghost"
                    :button-class="['text-xs text-[var(--color-primary)] hover:text-[var(--color-primary)]/80']"
                    label="Einladen"
                    @click="addUserInvite(user)"
                  />
                </li>
              </ul>
              <p v-else-if="searchTerm.length >= 2" class="mt-3 text-xs text-gray-500">Keine passenden Mitglieder gefunden.</p>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-black">E-Mail-Einladungen</h3>
              <div class="mt-2 grid gap-3 rounded-2xl border border-black/5 bg-white/80 p-4">
                <div class="flex flex-col gap-2">
                  <label for="invite-email" class="text-xs font-medium text-gray-600">E-Mail-Adresse</label>
                  <input
                    id="invite-email"
                    v-model="emailInvite.email"
                    type="email"
                    placeholder="mitglied@example.com"
                    class="w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm text-gray-700 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  />
                </div>
                <div class="flex flex-col gap-2">
                  <label for="invite-note" class="text-xs font-medium text-gray-600">Persönliche Notiz (optional)</label>
                  <input
                    id="invite-note"
                    v-model="emailInvite.note"
                    type="text"
                    maxlength="120"
                    placeholder="Freut mich, wenn du dabei bist!"
                    class="w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm text-gray-700 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  />
                </div>
                <FormButton
                  variant="primary"
                  label="E-Mail hinzufügen"
                  @click="addEmailInvite"
                />
              </div>
            </div>
          </div>

          <aside class="space-y-4 rounded-2xl border border-black/5 bg-white/70 p-5 text-sm text-gray-600">
            <div>
              <h4 class="text-sm font-semibold text-black">Geplante Einladungen</h4>
              <p class="text-xs text-gray-500">Diese Personen erhalten nach der Erstellung eine Einladung.</p>
            </div>
            <div class="space-y-3">
              <div v-if="inviteUsers.length" class="space-y-2">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Direkte Nutzer:innen</p>
                <div
                  v-for="user in inviteUsers"
                  :key="user.id"
                  class="flex items-center justify-between rounded-2xl border border-black/5 bg-white/90 px-3 py-2 text-sm"
                >
                  <div>
                    <p class="font-semibold text-black">{{ user.name }}</p>
                    <p class="text-xs text-gray-500">@{{ user.nameId }}</p>
                  </div>
                  <button type="button" class="text-xs text-red-500 underline-offset-2 hover:underline" @click="removeUserInvite(user.id)">
                    Entfernen
                  </button>
                </div>
              </div>

              <div v-if="inviteEmails.length" class="space-y-2">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">E-Mail</p>
                <div
                  v-for="email in inviteEmails"
                  :key="email.email"
                  class="flex items-center justify-between rounded-2xl border border-black/5 bg-white/90 px-3 py-2 text-sm"
                >
                  <div>
                    <p class="font-semibold text-black">{{ email.email }}</p>
                    <p v-if="email.note" class="text-xs text-gray-500">„{{ email.note }}“</p>
                  </div>
                  <button type="button" class="text-xs text-red-500 underline-offset-2 hover:underline" @click="removeEmailInvite(email.email)">
                    Entfernen
                  </button>
                </div>
              </div>

              <p v-if="!inviteUsers.length && !inviteEmails.length" class="text-xs text-gray-500">
                Noch keine Einladungen hinzugefügt. Du kannst diesen Schritt überspringen und später Mitglied werden lassen.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section v-else-if="currentStepId === 'review'" class="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm">
        <header class="mb-6">
          <h2 class="text-xl font-semibold text-black">Überblick</h2>
          <p class="text-sm text-gray-600">
            Prüfe deine Angaben. Nach der Erstellung kannst du im Teambereich weitere Anpassungen vornehmen.
          </p>
        </header>

        <div class="grid gap-6 md:grid-cols-2">
          <div class="space-y-4">
            <div class="rounded-2xl border border-black/5 bg-white/70 p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-gray-400">Basis</p>
              <p class="mt-2 text-lg font-semibold text-black">{{ form.name }}</p>
              <p class="text-sm text-gray-500 break-all">/team/{{ form.slug }}</p>
              <p class="mt-3 text-sm text-gray-600 whitespace-pre-line">{{ form.description || 'Keine Beschreibung angegeben.' }}</p>
            </div>

            <div class="rounded-2xl border border-black/5 bg-white/70 p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-gray-400">Mitgliedschaft</p>
              <p class="mt-2 text-sm text-gray-700">
                Sichtbarkeit: <strong>{{ visibilityLabel(form.visibility) }}</strong>
              </p>
              <p class="text-sm text-gray-700">
                Bestätigung nötig: <strong>{{ form.requireApproval || form.visibility !== 'public' ? 'Ja' : 'Nein' }}</strong>
              </p>
              <p class="text-sm text-gray-700">
                Max. Größe: <strong>{{ maxMembersLabel }}</strong>
              </p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="rounded-2xl border border-black/5 bg-white/70 p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-gray-400">Cover</p>
              <div class="mt-2 aspect-square w-full rounded-2xl border border-black/5 bg-gray-100">
                <img
                  v-if="cover.preview"
                  :src="cover.preview"
                  alt="Teamcover Vorschau"
                  class="h-full w-full rounded-2xl object-cover"
                />
                <div v-else class="flex h-full items-center justify-center text-xs text-gray-400">
                  Kein Cover ausgewählt
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-black/5 bg-white/70 p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-gray-400">Einladungen</p>
              <ul class="mt-2 space-y-2 text-sm text-gray-600">
                <li v-for="user in inviteUsers" :key="user.id" class="flex items-center gap-2">
                  <Icon icon="ph:user-circle-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
                  {{ user.name }} (@{{ user.nameId }})
                </li>
                <li v-for="email in inviteEmails" :key="email.email" class="flex items-center gap-2">
                  <Icon icon="ph:envelope-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
                  {{ email.email }}
                </li>
              </ul>
              <p v-if="!inviteUsers.length && !inviteEmails.length" class="text-xs text-gray-500">
                Keine Einladungen geplant.
              </p>
            </div>
          </div>
        </div>

        <div v-if="submitError" class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {{ submitError }}
        </div>
      </section>

      <footer class="flex flex-wrap justify-between gap-3">
        <FormButton
          variant="ghost"
          :button-class="['text-sm text-gray-600 hover:text-gray-800']"
          label="Zurück"
          :disabled="currentStep === 0 || isSubmitting"
          @click="prevStep"
        />
        <div class="flex gap-3">
          <FormButton
            v-if="currentStep < steps.length - 1"
            variant="primary"
            :label="currentStep === steps.length - 2 ? 'Übersicht anzeigen' : 'Weiter'"
            :loading="isSubmitting"
            @click="nextStep"
          />
          <FormButton
            v-else
            variant="primary"
            :label="isSubmitting ? 'Team wird erstellt…' : 'Team erstellen'"
            :loading="isSubmitting"
            @click="submit"
          />
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { upload } from '@vercel/blob/client'
import { useRouter, useCookie } from 'nuxt/app'
import FormButton from '@/components/atoms/form/FormButton.vue'
import { refreshAuthTeam } from '@/composables/useAuthTeam'

type VisibilityOption = 'public' | 'protected' | 'private'

const steps = [
  { id: 'details', title: 'Details', description: 'Name & Beschreibung' },
  { id: 'identity', title: 'Cover', description: 'Bild hochladen' },
  { id: 'membership', title: 'Mitgliedschaft', description: 'Regeln festlegen' },
  { id: 'invites', title: 'Einladungen', description: 'Freund:innen hinzufügen' },
  { id: 'review', title: 'Überblick', description: 'Alles prüfen' },
] as const

const visibilityOptions: Array<{ value: VisibilityOption; label: string; description: string }> = [
  {
    value: 'public',
    label: 'Öffentlich',
    description: 'In der Suche sichtbar. Interessierte können anfragen oder direkt beitreten (wenn erlaubt).',
  },
  {
    value: 'protected',
    label: 'Geschützt',
    description: 'In der Suche sichtbar, aber nur per Einladung beitretbar.',
  },
  {
    value: 'private',
    label: 'Privat',
    description: 'Nicht öffentlich. Nur über direkte Links oder Einladungen erreichbar.',
  },
]

const MIN_ZOOM = 1
const MAX_ZOOM = 3
const PREVIEW_SIZE = 320
const EXPORT_SIZE = 960

const router = useRouter()
const csrf = useCookie<string | null>('csrf_token')

const currentStep = ref(0)
const stepError = ref('')
const submitError = ref('')
const isSubmitting = ref(false)

const form = reactive({
  name: '',
  slug: '',
  description: '',
  visibility: 'public' as VisibilityOption,
  requireApproval: true,
  maxMembers: '',
})

const cover = reactive({
  file: null as File | null,
  preview: '',
  naturalWidth: 0,
  naturalHeight: 0,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  dragOriginX: 0,
  dragOriginY: 0,
})

const coverImageRef = ref<HTMLImageElement | null>(null)
const coverInputRef = ref<HTMLInputElement | null>(null)

const slugManuallyEdited = ref(false)

const searchTerm = ref('')
const searchTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
const searchPending = ref(false)
const searchResults = ref<Array<{ id: string; name: string; nameId: string; email: string; image: string | null }>>([])

const inviteUsers = ref<Array<{ id: string; name: string; nameId: string; email: string; image: string | null }>>([])
const inviteEmails = ref<Array<{ email: string; note: string }>>([])
const emailInvite = reactive({ email: '', note: '' })

const currentStepId = computed(() => steps[currentStep.value].id)

const baseScale = computed(() => {
  if (!cover.naturalWidth || !cover.naturalHeight) {
    return 1
  }
  return PREVIEW_SIZE / Math.min(cover.naturalWidth, cover.naturalHeight)
})

const displayScale = computed(() => baseScale.value * cover.zoom)

const coverImageStyle = computed(() => ({
  transform: `translate(calc(-50% + ${cover.offsetX}px), calc(-50% + ${cover.offsetY}px)) scale(${displayScale.value})`,
}))

watch(
  () => form.name,
  (value) => {
    if (!slugManuallyEdited.value) {
      form.slug = slugify(value)
    }
  },
)

watch(
  () => form.visibility,
  (value) => {
    if (value !== 'public') {
      form.requireApproval = true
    }
  },
)

watch(
  () => cover.zoom,
  () => clampOffsets(),
)

watch(
  () => [cover.naturalWidth, cover.naturalHeight],
  () => clampOffsets(),
)

watch(
  searchTerm,
  (value) => {
    if (searchTimeout.value) clearTimeout(searchTimeout.value)

    if (value.trim().length < 2) {
      searchResults.value = []
      searchPending.value = false
      return
    }

    searchPending.value = true
    searchTimeout.value = setTimeout(fetchUserSearch, 300)
  },
)

onMounted(() => {
  window.addEventListener('pointermove', onCoverPointerMove)
  window.addEventListener('pointerup', onCoverPointerUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onCoverPointerMove)
  window.removeEventListener('pointerup', onCoverPointerUp)
  if (searchTimeout.value) clearTimeout(searchTimeout.value)
})

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function onSlugInput() {
  slugManuallyEdited.value = true
  form.slug = slugify(form.slug)
}

function stepStatus(index: number) {
  if (index < currentStep.value) return 'bg-[var(--color-primary)] text-white'
  if (index === currentStep.value) return 'border border-[var(--color-primary)] text-[var(--color-primary)] bg-white'
  return 'border border-black/10 bg-white text-gray-400'
}

function resetCover() {
  cover.file = null
  cover.preview = ''
  cover.naturalWidth = 0
  cover.naturalHeight = 0
  cover.zoom = 1
  cover.offsetX = 0
  cover.offsetY = 0
  if (coverInputRef.value) coverInputRef.value.value = ''
}

async function onCoverSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    stepError.value = 'Bitte wähle eine gültige Bilddatei.'
    return
  }

  if (file.size > 8 * 1024 * 1024) {
    stepError.value = 'Das Bild darf maximal 8 MB groß sein.'
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    cover.preview = String(reader.result)
    cover.file = file
    cover.zoom = 1.2
    cover.offsetX = 0
    cover.offsetY = 0
    const img = new Image()
    img.onload = () => {
      cover.naturalWidth = img.naturalWidth
      cover.naturalHeight = img.naturalHeight
      clampOffsets()
    }
    img.src = cover.preview
  }
  reader.onerror = () => {
    stepError.value = 'Das Bild konnte nicht geladen werden.'
  }
  reader.readAsDataURL(file)
}

function onCoverPointerDown(event: PointerEvent) {
  if (!cover.preview) return
  cover.isDragging = true
  cover.dragStartX = event.clientX
  cover.dragStartY = event.clientY
  cover.dragOriginX = cover.offsetX
  cover.dragOriginY = cover.offsetY
}

function onCoverPointerMove(event: PointerEvent) {
  if (!cover.isDragging) return
  const deltaX = event.clientX - cover.dragStartX
  const deltaY = event.clientY - cover.dragStartY
  setOffsets(cover.dragOriginX + deltaX, cover.dragOriginY + deltaY)
}

function onCoverPointerUp() {
  cover.isDragging = false
}

function clampOffsets() {
  setOffsets(cover.offsetX, cover.offsetY)
}

function setOffsets(x: number, y: number) {
  const drawWidth = cover.naturalWidth * displayScale.value
  const drawHeight = cover.naturalHeight * displayScale.value

  const maxOffsetX = Math.max(0, (drawWidth - PREVIEW_SIZE) / 2)
  const maxOffsetY = Math.max(0, (drawHeight - PREVIEW_SIZE) / 2)

  cover.offsetX = Math.min(Math.max(x, -maxOffsetX), maxOffsetX)
  cover.offsetY = Math.min(Math.max(y, -maxOffsetY), maxOffsetY)
}

async function fetchUserSearch() {
  const query = searchTerm.value.trim()
  if (query.length < 2) {
    searchPending.value = false
    searchResults.value = []
    return
  }
  try {
    const res = await $fetch<{ users: typeof searchResults.value }>(
      '/api/team/user-search',
      {
        credentials: 'include',
        params: { q: query, limit: 8 },
      },
    )
    const existingIds = new Set(inviteUsers.value.map((u) => u.id))
    searchResults.value = res.users.filter((user) => !existingIds.has(user.id))
  } catch (error) {
    console.error('User search failed', error)
    searchResults.value = []
  } finally {
    searchPending.value = false
  }
}

function addUserInvite(user: { id: string; name: string; nameId: string; email: string; image: string | null }) {
  if (inviteUsers.value.some((item) => item.id === user.id)) return
  inviteUsers.value.push(user)
  searchResults.value = searchResults.value.filter((item) => item.id !== user.id)
}

function removeUserInvite(id: string) {
  inviteUsers.value = inviteUsers.value.filter((user) => user.id !== id)
}

function addEmailInvite() {
  const email = emailInvite.email.trim().toLowerCase()
  if (!email) return
  if (!validateEmail(email)) {
    stepError.value = 'Bitte gib eine gültige E-Mail-Adresse ein.'
    return
  }
  if (inviteEmails.value.some((entry) => entry.email === email)) {
    stepError.value = 'Diese E-Mail wurde bereits hinzugefügt.'
    return
  }
  inviteEmails.value.push({ email, note: emailInvite.note.trim() })
  emailInvite.email = ''
  emailInvite.note = ''
}

function removeEmailInvite(email: string) {
  inviteEmails.value = inviteEmails.value.filter((entry) => entry.email !== email)
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function visibilityLabel(value: VisibilityOption) {
  const option = visibilityOptions.find((opt) => opt.value === value)
  return option ? option.label : value
}

const maxMembersLabel = computed(() => (form.maxMembers ? `${form.maxMembers} Personen` : 'Unbegrenzt'))

function nextStep() {
  stepError.value = ''
  if (!validateStep()) return
  if (currentStep.value < steps.length - 1) {
    currentStep.value += 1
  }
}

function prevStep() {
  stepError.value = ''
  if (currentStep.value > 0) {
    currentStep.value -= 1
  }
}

function validateStep() {
  switch (currentStepId.value) {
    case 'details': {
      if (!form.name.trim()) {
        stepError.value = 'Bitte gib einen Teamnamen ein.'
        return false
      }
      if (!form.slug.trim()) {
        stepError.value = 'Bitte gib einen Link an.'
        return false
      }
      return true
    }
    case 'membership': {
      if (form.maxMembers) {
        const numeric = Number.parseInt(form.maxMembers, 10)
        if (!Number.isFinite(numeric) || numeric < 2 || numeric > 500) {
          stepError.value = 'Die maximale Teamgröße muss zwischen 2 und 500 liegen.'
          return false
        }
      }
      return true
    }
    default:
      return true
  }
}

async function submit() {
  stepError.value = ''
  submitError.value = ''
  if (!validateStep()) return

  isSubmitting.value = true
  try {
    const payload: Record<string, any> = {
      name: form.name.trim(),
      nameId: form.slug.trim(),
      description: form.description.trim() || null,
      visibility: form.visibility,
      requireApproval: form.visibility === 'public' ? form.requireApproval : true,
      maxMembers: form.maxMembers ? Number.parseInt(form.maxMembers, 10) : null,
      invites: {
        userIds: inviteUsers.value.map((user) => user.id),
        emails: inviteEmails.value,
      },
    }

    const coverBlob = await exportCoverBlob()
    if (coverBlob) {
      const uploadResult = await upload(coverBlob.name ?? 'team-cover.jpg', coverBlob, {
        access: 'public',
        handleUploadUrl: '/api/team/cover-upload',
        multipart: true,
        headers: csrf.value ? { 'x-csrf-token': csrf.value } : undefined,
      })
      payload.coverImage = uploadResult.url
    }

    const response = await $fetch<{ ok: boolean; team: { nameId: string } }>('/api/team/create', {
      method: 'POST',
      credentials: 'include',
      headers: { 'x-csrf-token': csrf.value ?? '' },
      body: payload,
    })

    if (response.ok && response.team) {
      await refreshAuthTeam()
      await router.push('/team/manage')
    }
  } catch (error: any) {
    console.error('Team Erstellung fehlgeschlagen', error)
    submitError.value = error?.data?.message || error?.message || 'Team konnte nicht erstellt werden.'
  } finally {
    isSubmitting.value = false
  }
}

async function exportCoverBlob(): Promise<File | null> {
  if (!cover.preview || !cover.file || !cover.naturalWidth || !cover.naturalHeight) {
    return null
  }

  const img = new Image()
  img.src = cover.preview
  await img.decode()

  const canvas = document.createElement('canvas')
  canvas.width = EXPORT_SIZE
  canvas.height = EXPORT_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const scale = displayScale.value
  const drawWidth = cover.naturalWidth * scale
  const drawHeight = cover.naturalHeight * scale
  const drawX = PREVIEW_SIZE / 2 + cover.offsetX - drawWidth / 2
  const drawY = PREVIEW_SIZE / 2 + cover.offsetY - drawHeight / 2

  const sourceX = Math.max(0, (0 - drawX) / scale)
  const sourceY = Math.max(0, (0 - drawY) / scale)
  const sourceWidth = Math.min(cover.naturalWidth - sourceX, PREVIEW_SIZE / scale)
  const sourceHeight = Math.min(cover.naturalHeight - sourceY, PREVIEW_SIZE / scale)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE)
  ctx.drawImage(
    img,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    EXPORT_SIZE,
    EXPORT_SIZE,
  )

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.9),
  )

  if (!blob) return null
  return new File([blob], `team-cover-${Date.now()}.jpg`, { type: 'image/jpeg' })
}
</script>
