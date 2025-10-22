<template>
  <div
    class="relative overflow-hidden rounded-3xl border border-black/5 bg-gradient-to-br from-[var(--color-primary)]/10 via-white to-[var(--color-accent)]/10 p-6 sm:p-10">
    <div class="absolute inset-0">
      <div
        class="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[var(--color-primary)]/10 blur-3xl">
      </div>
      <div
        class="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-[var(--color-accent)]/20 blur-3xl">
      </div>
    </div>

    <div class="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div
          class="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-xl ring-2 ring-[var(--color-accent)]/30">
          <img v-if="user.image" :src="user.image" :alt="`Profilbild von ${user.name}`"
            class="h-full w-full object-cover" />
          <div v-else
            class="flex h-full w-full items-center justify-center bg-white text-3xl font-semibold text-[var(--color-accent)]">
            {{ initials }}
          </div>
        </div>


        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-3">
            <h1 class="text-3xl  font-semibold tracking-tight text-black md:text-4xl">{{ user.name }}</h1>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <Icon icon="ph:envelope-simple" class="h-4 w-4 text-[var(--color-primary)]" />
            <span>{{ user.email }}</span>
          </div>

          <div v-if="team"
            class="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm">
            <Icon icon="ph:users-three-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
            <span>{{ team.name }}</span>
            <span v-if="team.role" class="text-gray-400">· {{ team.role }}</span>
            <button type="button" class="text-[var(--color-accent)] underline-offset-2 hover:underline"
              @click="$emit('manage-team')">
              Team verwalten
            </button>
          </div>
          <button v-else type="button"
            class="inline-flex items-center gap-2 rounded-full border border-dashed border-[var(--color-primary)]/40 px-4 py-2 text-sm font-semibold text-[var(--color-primarys)] hover:bg-white hover:shadow"
            @click="$emit('manage-team')">
            <Icon icon="ph:user-plus-duotone" class="h-4 w-4" />
            Team beitreten
          </button>
        </div>
      </div>

      <div class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <button type="button"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[var(--color-primary)]/30 transition hover:brightness-95 cursor-pointer"
          @click="$emit('edit-profile')">
          <Icon icon="ph:user-circle-gear-duotone" class="h-5 w-5" />
          Profil bearbeiten
        </button>

        <button type="button"
          class="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-accent)]/40 bg-white px-4 py-2 text-sm font-semibold text-[var(--color-accent)] shadow-sm hover:bg-[var(--color-accent)]/10 cursor-pointer"
          @click="$emit('open-post-composer')">
          <Icon icon="ph:pen-nib-duotone" class="h-5 w-5" />
          Beitrag erstellen
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue'
import { Icon } from '@iconify/vue'

type UserSummary = {
  name: string
  nameId: string
  email: string
  image?: string | null
  bio?: string | null
}

type TeamSummary = {
  name: string
  role?: string | null
} | null

const props = defineProps<{
  user: UserSummary
  team?: TeamSummary
}>()

const { user, team } = toRefs(props)

defineEmits<{
  (e: 'edit-profile'): void
  (e: 'change-picture'): void
  (e: 'manage-team'): void
  (e: 'open-post-composer'): void
}>()

const initials = computed(
  () =>
    (user.value?.name ?? '')
      .split(' ')
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '?',
)
</script>
