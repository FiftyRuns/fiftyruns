<template>
  <div class="px-4 py-16">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <header class="flex flex-col gap-2">
        <NuxtLink to="/profile" class="text-sm text-[var(--color-primary)] underline-offset-2 hover:underline">
          ← Zurück zum Profil
        </NuxtLink>
        <h1 class="text-3xl font-semibold text-black">Team verwalten</h1>
        <p class="text-sm text-gray-600">
          Passe euer Profil an, verwalte Mitglieder und lade neue Teamies ein.
        </p>
      </header>

      <div v-if="pending" class="grid gap-6 md:grid-cols-2">
        <div v-for="n in 4" :key="n" class="h-48 animate-pulse rounded-3xl border border-black/5 bg-white/70" />
      </div>

      <div v-else-if="errorMessage" class="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-600">
        {{ errorMessage }}
      </div>

      <div v-else-if="!team" class="rounded-3xl border border-dashed border-black/10 bg-white/80 px-6 py-10 text-center text-gray-600">
        <p class="text-lg font-semibold text-black">Kein Team verfügbar</p>
        <p class="mt-2 text-sm">Diese Seite steht nur Team-Admins offen. Bitte erstelle oder trete einem Team bei.</p>
      </div>

      <div v-else class="space-y-10">
        <section class="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm">
          <header class="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Teaminfos</p>
              <h2 class="text-xl font-semibold text-black">{{ team.name }}</h2>
            </div>
            <FormButton variant="ghost" :button-class="['text-sm text-[var(--color-primary)]']" @click="refresh">
              <Icon icon="ph:arrow-clockwise-duotone" class="mr-2 h-4 w-4" />
              Aktualisieren
            </FormButton>
          </header>

          <div class="grid gap-6 xl:grid-cols-[minmax(0,2fr),minmax(0,1.3fr)]">
            <div class="space-y-6">
              <div class="space-y-3">
                <label class="block text-sm font-medium text-gray-700">
                  Beschreibung
                  <textarea
                    v-model="form.description"
                    rows="4"
                    class="mt-2 w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm text-gray-700 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  />
                </label>
                <label class="block text-sm font-medium text-gray-700">
                  Standort (optional)
                  <input
                    v-model="form.location"
                    type="text"
                    class="mt-2 w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm text-gray-700 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  />
                </label>
              </div>

              <div class="space-y-3">
                <p class="text-sm font-semibold text-gray-700">Sichtbarkeit</p>
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
              </div>

              <div class="space-y-3">
                <label class="flex items-center gap-3 text-sm font-semibold text-gray-700">
                  <input
                    v-model="form.requireApproval"
                    type="checkbox"
                    class="h-4 w-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                    :disabled="form.visibility !== 'public'"
                  />
                  Beitrittsanfragen benötigen Bestätigung
                </label>
                <p class="text-xs text-gray-500">
                  Wenn deaktiviert, treten Interessierte direkt bei (nur für öffentliche Teams).
                </p>
              </div>

              <div>
                <label for="max-members" class="mb-2 block text-sm font-semibold text-gray-700">Max. Teamgröße</label>
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
                  <span class="text-xs text-gray-500">Leer lassen für unbegrenzt.</span>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-3">
                <FormButton :loading="formState.updating" label="Änderungen speichern" @click="saveTeam" />
                <p v-if="formState.success" class="text-sm text-green-600">{{ formState.success }}</p>
                <p v-else-if="formState.error" class="text-sm text-red-600">{{ formState.error }}</p>
              </div>
            </div>

            <div class="space-y-4 rounded-2xl border border-black/5 bg-white/70 p-5">
              <div>
                <p class="text-xs uppercase tracking-[0.2em] text-gray-400">Cover</p>
                <div class="mt-3 space-y-3">
                  <div class="relative mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-2xl border border-black/5 bg-gray-100">
                    <img
                      v-if="cover.preview || team.coverImage"
                      :src="cover.preview || team.coverImage"
                      alt="Teambild"
                      class="h-full w-full object-cover"
                    />
                    <div v-else class="flex h-full items-center justify-center text-xs text-gray-400">Kein Cover</div>
                    <input
                      ref="coverInputRef"
                      type="file"
                      accept="image/*"
                      class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      @change="onCoverSelect"
                    />
                  </div>

                  <div v-if="cover.preview" class="space-y-2">
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
                    <p class="text-xs text-gray-500">Ziehe das Bild, um es neu zu positionieren.</p>
                    <div
                      class="relative mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-xl border border-black/10 bg-gray-100"
                      @pointerdown="onCoverPointerDown"
                      @pointerup="onCoverPointerUp"
                      @pointerleave="onCoverPointerUp"
                    >
                      <img
                        :src="cover.preview"
                        alt="Cover Vorschau"
                        class="absolute left-1/2 top-1/2 h-auto w-auto select-none"
                        draggable="false"
                        :style="coverImageStyle"
                      />
                      <div v-if="cover.isDragging" class="absolute inset-0 bg-black/10" />
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                      <FormButton
                        :loading="coverState.updating"
                        label="Cover speichern"
                        @click="saveCover"
                      />
                      <button type="button" class="text-xs text-gray-500 underline-offset-2 hover:underline" @click="resetCover">
                        Abbrechen
                      </button>
                      <p v-if="coverState.error" class="text-xs text-red-600">{{ coverState.error }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="space-y-3 text-sm text-gray-700">
                <div class="flex items-center justify-between">
                  <span class="text-xs uppercase tracking-[0.2em] text-gray-400">Mitglieder</span>
                  <span class="font-semibold text-black">{{ team.memberCount }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-xs uppercase tracking-[0.2em] text-gray-400">Link</span>
                  <div class="flex items-center gap-2 text-xs text-gray-600">
                    <NuxtLink :to="`/team/${team.nameId}`" class="font-semibold text-[var(--color-primary)] hover:underline">
                      /team/{{ team.nameId }}
                    </NuxtLink>
                    <button type="button" class="text-xs text-gray-500 underline-offset-2 hover:underline" @click="copyTeamLink">
                      Link kopieren
                    </button>
                    <span v-if="copyState === 'copied'" class="text-green-600">kopiert</span>
                    <span v-else-if="copyState === 'error'" class="text-red-500">Fehler</span>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-xs uppercase tracking-[0.2em] text-gray-400">Beitritt</span>
                  <span class="text-xs text-gray-600">
                    {{
                      form.visibility === 'public'
                        ? form.requireApproval
                          ? 'Anfragen erforderlich'
                          : 'Direkter Beitritt erlaubt'
                        : 'Nur per Einladung'
                    }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm">
          <header class="mb-6 flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold text-black">Mitglieder</h2>
              <p class="text-sm text-gray-600">Verwalte dein Team. Entferne inaktive Nutzer:innen bei Bedarf.</p>
            </div>
          </header>
          <div v-if="!team.members.length" class="rounded-2xl border border-dashed border-black/10 bg-white/70 p-6 text-center text-sm text-gray-500">
            Noch keine Mitglieder vorhanden.
          </div>
          <div v-else class="grid gap-4">
            <article
              v-for="member in team.members"
              :key="member.id"
              class="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-sm font-semibold text-[var(--color-primary)]">
                  <NuxtImg
                    v-if="member.image"
                    :src="member.image"
                    :alt="member.name"
                    class="h-12 w-12 rounded-full object-cover"
                    width="96"
                    height="96"
                    format="webp"
                  />
                  <span v-else>{{ member.name.slice(0, 2).toUpperCase() }}</span>
                </div>
                <div>
                  <p class="text-sm font-semibold text-black">{{ member.name }}</p>
                  <p class="text-xs text-gray-500">@{{ member.nameId }}</p>
                  <p class="text-xs text-gray-500">{{ member.roleLabel }}</p>
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <span v-if="member.isViewer" class="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">Du</span>
                <FormButton
                  v-else-if="member.role !== 'ADMIN'"
                  variant="ghost"
                  :button-class="['text-xs text-red-500 hover:text-red-600']"
                  :loading="memberActions[member.id]"
                  label="Entfernen"
                  @click="removeMember(member.id)"
                />
                <span v-else class="text-xs text-gray-500">Admin können nicht entfernt werden</span>
              </div>
            </article>
          </div>
        </section>

        <section class="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm">
          <header class="mb-6 flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold text-black">Beitrittsanfragen</h2>
              <p class="text-sm text-gray-600">Bestätige neue Mitglieder oder lehne Anfragen freundlich ab.</p>
            </div>
            <span class="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
              {{ pendingRequests.length }} offen
            </span>
          </header>
          <div v-if="!team.joinRequests.length" class="rounded-2xl border border-dashed border-black/10 bg-white/70 p-6 text-center text-sm text-gray-500">
            Noch keine Anfragen.
          </div>
          <div v-else class="space-y-4">
            <article
              v-for="request in team.joinRequests"
              :key="request.id"
              class="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white/70 p-5 shadow-sm md:flex-row md:items-center md:justify-between"
            >
              <div class="flex items-start gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-sm font-semibold text-[var(--color-primary)]">
                  <NuxtImg
                    v-if="request.user.image"
                    :src="request.user.image"
                    :alt="request.user.name"
                    class="h-12 w-12 rounded-full object-cover"
                    width="96"
                    height="96"
                    format="webp"
                  />
                  <span v-else>{{ request.user.name.slice(0, 2).toUpperCase() }}</span>
                </div>
                <div>
                  <p class="text-sm font-semibold text-black">{{ request.user.name }}</p>
                  <p class="text-xs text-gray-500">@{{ request.user.nameId }}</p>
                  <p v-if="request.message" class="mt-2 text-xs text-gray-600">„{{ request.message }}“</p>
                  <p class="mt-1 text-xs text-gray-400">
                    Angefragt am {{ formatDate(request.createdAt) }}
                    <span v-if="request.status !== 'pending'"> · {{ statusLabel(request.status) }}</span>
                  </p>
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <template v-if="request.status === 'pending'">
                  <FormButton
                    :loading="requestActions[request.id]?.approve"
                    label="Annehmen"
                    :button-class="['bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90']"
                    @click="approveRequest(request.id)"
                  />
                  <FormButton
                    :loading="requestActions[request.id]?.decline"
                    variant="ghost"
                    :button-class="['text-xs text-red-500 hover:text-red-600']"
                    label="Ablehnen"
                    @click="declineRequest(request.id)"
                  />
                </template>
                <span v-else class="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                  {{ statusLabel(request.status) }}
                </span>
              </div>
            </article>
          </div>
        </section>

        <section class="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm">
          <header class="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold text-black">Einladungen</h2>
              <p class="text-sm text-gray-600">
                Lade Mitglieder per Suche oder E-Mail ein. Einladungen laufen automatisch nach einigen Tagen ab.
              </p>
            </div>
          </header>

          <div class="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
            <div class="space-y-6">
              <div>
                <h3 class="text-sm font-semibold text-black">Nutzer:innen suchen</h3>
                <div class="mt-2 flex items-center gap-2 rounded-2xl border border-black/10 bg-white/90 px-4 py-3 focus-within:ring-2 focus-within:ring-[var(--color-primary)]/30">
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
                    <div>
                      <p class="text-sm font-semibold text-black">{{ user.name }}</p>
                      <p class="text-xs text-gray-500">@{{ user.nameId }} · {{ user.email }}</p>
                    </div>
                    <FormButton
                      variant="ghost"
                      :button-class="['text-xs text-[var(--color-primary)] hover:text-[var(--color-primary)]/80']"
                      :loading="userInviteLoading[user.id]"
                      label="Einladen"
                      @click="inviteUser(user)"
                    />
                  </li>
                </ul>
                <p v-else-if="searchTerm.length >= 2" class="mt-3 text-xs text-gray-500">
                  Keine passenden Mitglieder gefunden oder bereits eingeladen.
                </p>
              </div>

              <div>
                <h3 class="text-sm font-semibold text-black">E-Mail-Einladungen</h3>
                <form class="mt-2 grid gap-3 rounded-2xl border border-black/5 bg-white/80 p-4" @submit.prevent="createInvite">
                  <div class="flex flex-col gap-2">
                    <label for="invite-email" class="text-xs font-medium text-gray-600">E-Mail-Adresse</label>
                    <input
                      id="invite-email"
                      v-model="inviteForm.email"
                      type="email"
                      placeholder="mitglied@example.com"
                      class="w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm text-gray-700 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                    />
                  </div>
                  <div class="flex flex-col gap-2">
                    <label for="invite-note" class="text-xs font-medium text-gray-600">Notiz (optional)</label>
                    <input
                      id="invite-note"
                      v-model="inviteForm.note"
                      type="text"
                      maxlength="120"
                      placeholder="Schön, wenn du dabei bist!"
                      class="w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm text-gray-700 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                    />
                  </div>
                  <div class="flex flex-col gap-2">
                    <label for="invite-expire" class="text-xs font-medium text-gray-600">Läuft ab in (Tagen)</label>
                    <input
                      id="invite-expire"
                      v-model.number="inviteForm.expiresInDays"
                      type="number"
                      min="1"
                      max="30"
                      class="w-24 rounded-2xl border border-black/10 bg-white/90 px-3 py-2 text-sm text-gray-700 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                    />
                  </div>
                  <FormButton type="submit" :loading="inviteState.loading" label="Einladung erstellen" />
                  <p v-if="inviteState.error" class="text-xs text-red-600">{{ inviteState.error }}</p>
                  <p v-else-if="inviteState.success" class="text-xs text-green-600">{{ inviteState.success }}</p>
                </form>
              </div>
            </div>

            <aside class="space-y-4 rounded-2xl border border-black/5 bg-white/70 p-5 text-sm text-gray-600">
              <div>
                <p class="text-xs uppercase tracking-[0.2em] text-gray-400">Aktive Einladungen</p>
                <p class="mt-1 text-xs text-gray-500">
                  Lösche abgelaufene Einladungen oder teile den Link erneut.
                </p>
              </div>

              <div v-if="!team.invites.length" class="rounded-2xl border border-dashed border-black/10 bg-white/60 p-4 text-center text-xs text-gray-500">
                Noch keine Einladungen erstellt.
              </div>

              <div v-else class="space-y-3">
                <article
                  v-for="invite in team.invites"
                  :key="invite.id"
                  class="rounded-2xl border border-black/5 bg-white/80 p-4 text-sm text-gray-700"
                >
                  <div class="flex flex-col gap-1">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <p class="font-semibold text-black">
                        {{ invite.email || invite.targetUser?.name || 'Allgemeiner Link' }}
                      </p>
                      <span
                        class="rounded-full bg-gray-100 px-2 py-0.5 text-xs uppercase tracking-wide"
                        :class="invite.status === 'pending' ? 'text-[var(--color-primary)]' : invite.status === 'accepted' ? 'text-green-600' : 'text-red-500'"
                      >
                        {{ statusLabel(invite.status) }}
                      </span>
                    </div>
                    <p v-if="invite.note" class="text-xs text-gray-500">„{{ invite.note }}“</p>
                    <p v-if="invite.targetUser" class="text-xs text-gray-500">
                      Eingeladen für {{ invite.targetUser.name }} (@{{ invite.targetUser.nameId }})
                    </p>
                  </div>
                  <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>Erstellt: {{ formatDate(invite.invitedAt) }}</span>
                    <span>Gültig bis: {{ formatDate(invite.expiresAt) }}</span>
                    <span v-if="invite.acceptedAt">Angenommen: {{ formatDate(invite.acceptedAt) }}</span>
                  </div>
                  <div v-if="invite.status === 'pending'" class="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <code class="rounded-full bg-gray-100 px-3 py-1 text-gray-700">{{ invite.token }}</code>
                    <button
                      type="button"
                      class="text-[var(--color-primary)] underline-offset-2 hover:underline"
                      @click="copyInviteLink(invite.token)"
                    >
                      Link kopieren
                    </button>
                    <span v-if="copiedInvite === invite.token" class="text-green-600">kopiert</span>
                    <FormButton
                      :loading="inviteRemovals[invite.id]"
                      variant="ghost"
                      :button-class="['text-xs text-red-500 hover:text-red-600']"
                      label="Löschen"
                      @click="deleteInvite(invite.id)"
                    />
                  </div>
                </article>
              </div>
            </aside>
          </div>
        </section>

        <section class="rounded-3xl border border-red-200 bg-white/80 p-6 shadow-sm">
          <div class="space-y-2">
            <h2 class="text-lg font-semibold text-red-600">Team löschen</h2>
            <p class="text-sm text-gray-600">
              Das Team wird dauerhaft entfernt. Alle Mitglieder verlieren den Zugriff und ausstehende Einladungen
              werden gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
          </div>
          <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
              :disabled="deleteState.loading"
              @click="deleteTeam"
            >
              <Icon icon="ph:trash-duotone" class="h-5 w-5" aria-hidden="true" />
              <span>{{ deleteState.loading ? 'Wird gelöscht…' : 'Team dauerhaft löschen' }}</span>
            </button>
            <p v-if="deleteState.error" class="text-xs text-red-600">{{ deleteState.error }}</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { upload } from '@vercel/blob/client'
import { useAsyncData, useCookie, useRequestHeaders } from 'nuxt/app'
import { useRouter } from 'vue-router'
import FormButton from '@/components/atoms/form/FormButton.vue'
import type { TeamManageData, TeamJoinRequest } from '@/types/team'
import { setAuthTeam } from '@/composables/useAuthTeam'

type VisibilityOption = 'public' | 'protected' | 'private'

const visibilityOptions: Array<{ value: VisibilityOption; label: string; description: string }> = [
  {
    value: 'public',
    label: 'Öffentlich',
    description: 'In der Suche sichtbar. Interessierte können anfragen oder direkt beitreten.',
  },
  {
    value: 'protected',
    label: 'Geschützt',
    description: 'In der Suche sichtbar, aber nur per Einladung beitretbar.',
  },
  {
    value: 'private',
    label: 'Privat',
    description: 'Nicht öffentlich sichtbar. Beitritt ausschließlich per Einladung.',
  },
]

const PREVIEW_SIZE = 220
const EXPORT_SIZE = 960

const csrf = useCookie('csrf_token')
const router = useRouter()

const requestHeaders = useRequestHeaders(['cookie'])

const { data, pending, error, refresh } = await useAsyncData('team-manage', async () => {
  const res = await $fetch<{ team: TeamManageData } | { ok: false }>(
    '/api/team/manage',
    {
      credentials: 'include',
      headers: requestHeaders,
    },
  ).catch((err: any) => {
    if (err?.data?.message) {
      throw new Error(err.data.message)
    }
    throw err
  })
  return 'team' in res ? res : null
})

const team = computed(() => data.value?.team ?? null)
const errorMessage = computed(() => {
  if (pending.value) return ''
  const err = error.value as unknown
  if (!err) return ''

  console.error('[team/manage] Failed to load manage data', err)
  return 'Teamdaten konnten nicht geladen werden. Bitte versuche es später erneut.'
})

const form = reactive({
  description: '',
  location: '',
  visibility: 'public' as VisibilityOption,
  requireApproval: true,
  maxMembers: '',
})

watch(
  team,
  (value) => {
    if (!value) {
      setAuthTeam(null)
      return
    }
    setAuthTeam({
      id: value.id,
      name: value.name,
      nameId: value.nameId,
      role: 'ADMIN',
      roleLabel: 'Admin',
    })
    form.description = value.description
    form.location = value.location
    form.visibility = value.visibility
    form.requireApproval = value.requireApproval
    form.maxMembers = value.maxMembers != null ? String(value.maxMembers) : ''
  },
  { immediate: true },
)

watch(
  () => form.visibility,
  (visibility) => {
    if (visibility !== 'public') {
      form.requireApproval = true
    }
  },
)

const formState = reactive({
  updating: false,
  success: '',
  error: '',
})

const cover = reactive({
  preview: '',
  file: null as File | null,
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

const coverState = reactive({
  updating: false,
  error: '',
})

const coverInputRef = ref<HTMLInputElement | null>(null)

const baseScale = computed(() => {
  if (!cover.naturalWidth || !cover.naturalHeight) return 1
  return PREVIEW_SIZE / Math.min(cover.naturalWidth, cover.naturalHeight)
})

const displayScale = computed(() => baseScale.value * cover.zoom)

const coverImageStyle = computed(() => ({
  transform: `translate(calc(-50% + ${cover.offsetX}px), calc(-50% + ${cover.offsetY}px)) scale(${displayScale.value})`,
}))

onMounted(() => {
  window.addEventListener('pointermove', onCoverPointerMove)
  window.addEventListener('pointerup', onCoverPointerUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onCoverPointerMove)
  window.removeEventListener('pointerup', onCoverPointerUp)
})

watch(
  () => cover.zoom,
  () => clampOffsets(),
)

watch(
  () => [cover.naturalWidth, cover.naturalHeight],
  () => clampOffsets(),
)

const requestActions = reactive<Record<string, { approve?: boolean; decline?: boolean }>>({})
const memberActions = reactive<Record<string, boolean>>({})

const inviteState = reactive({ loading: false, error: '', success: '' })
const deleteState = reactive({ loading: false, error: '' })
const inviteForm = reactive({
  email: '',
  note: '',
  expiresInDays: 7,
})
const inviteRemovals = reactive<Record<string, boolean>>({})

const userInviteLoading = reactive<Record<string, boolean>>({})

const copyState = ref<'idle' | 'copied' | 'error'>('idle')
const copiedInvite = ref('')

const searchTerm = ref('')
const searchResults = ref<Array<{ id: string; name: string; nameId: string; email: string; image: string | null }>>([])
const searchPending = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

watch(
  searchTerm,
  (value) => {
    if (searchTimeout) clearTimeout(searchTimeout)
    if (value.trim().length < 2) {
      searchResults.value = []
      searchPending.value = false
      return
    }
    searchPending.value = true
    searchTimeout = setTimeout(fetchUserSearch, 300)
  },
)

const pendingRequests = computed(() =>
  (team.value?.joinRequests ?? []).filter((request) => request.status === 'pending'),
)

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function statusLabel(status: TeamJoinRequest['status'] | 'accepted' | 'expired') {
  switch (status) {
    case 'pending':
      return 'Offen'
    case 'approved':
    case 'accepted':
      return 'Angenommen'
    case 'declined':
      return 'Abgelehnt'
    case 'expired':
      return 'Abgelaufen'
    default:
      return 'Unbekannt'
  }
}

async function copy(text: string) {
  if (!text) return false
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    return success
  } catch {
    return false
  }
}

async function copyTeamLink() {
  if (!process.client || !team.value) return
  const ok = await copy(`${window.location.origin}/team/${team.value.nameId}`)
  copyState.value = ok ? 'copied' : 'error'
  setTimeout(() => {
    copyState.value = 'idle'
  }, 2000)
}

async function copyInviteLink(token: string) {
  if (!process.client) return
  const ok = await copy(`${window.location.origin}/team/invite/${token}`)
  if (ok) {
    copiedInvite.value = token
    setTimeout(() => {
      copiedInvite.value = ''
    }, 2000)
  }
}

function resetCover() {
  cover.preview = ''
  cover.file = null
  cover.naturalWidth = 0
  cover.naturalHeight = 0
  cover.zoom = 1
  cover.offsetX = 0
  cover.offsetY = 0
  coverState.error = ''
  if (coverInputRef.value) coverInputRef.value.value = ''
}

async function onCoverSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    coverState.error = 'Bitte wähle eine Bilddatei.'
    return
  }
  if (file.size > 8 * 1024 * 1024) {
    coverState.error = 'Bild darf nicht größer als 8 MB sein.'
    return
  }
  coverState.error = ''

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
    coverState.error = 'Bild konnte nicht geladen werden.'
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
  const maxX = Math.max(0, (drawWidth - PREVIEW_SIZE) / 2)
  const maxY = Math.max(0, (drawHeight - PREVIEW_SIZE) / 2)
  cover.offsetX = Math.min(Math.max(x, -maxX), maxX)
  cover.offsetY = Math.min(Math.max(y, -maxY), maxY)
}

async function exportCoverBlob(): Promise<File | null> {
  if (!cover.preview || !cover.file || !cover.naturalWidth || !cover.naturalHeight) return null
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

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.9))
  if (!blob) return null
  return new File([blob], `team-cover-${Date.now()}.jpg`, { type: 'image/jpeg' })
}

async function saveCover() {
  if (!cover.preview) return
  coverState.updating = true
  coverState.error = ''
  try {
    const blob = await exportCoverBlob()
    if (!blob) {
      coverState.error = 'Cover konnte nicht generiert werden.'
      return
    }
    const result = await upload(blob.name, blob, {
      access: 'public',
      handleUploadUrl: '/api/team/cover-upload',
      multipart: true,
      headers: csrf.value ? { 'x-csrf-token': csrf.value } : undefined,
    })
    await $fetch('/api/team/update', {
      method: 'PATCH',
      headers: { 'x-csrf-token': csrf.value ?? '' },
      credentials: 'include',
      body: { coverImage: result.url },
    })
    resetCover()
    await refresh()
  } catch (err: any) {
    coverState.error = err?.data?.message || err?.message || 'Cover konnte nicht gespeichert werden.'
  } finally {
    coverState.updating = false
  }
}

async function saveTeam() {
  if (!team.value) return
  formState.updating = true
  formState.error = ''
  formState.success = ''
  try {
    const payload: Record<string, any> = {
      description: form.description,
      location: form.location,
      visibility: form.visibility,
      requireApproval: form.visibility === 'public' ? form.requireApproval : true,
    }

    if (form.maxMembers) {
      const numeric = Number.parseInt(form.maxMembers, 10)
      if (!Number.isFinite(numeric) || numeric < 2 || numeric > 500) {
        throw createError('Maximale Teamgröße muss zwischen 2 und 500 liegen.')
      }
      payload.maxMembers = numeric
    } else {
      payload.maxMembers = null
    }

    await $fetch('/api/team/update', {
      method: 'PATCH',
      headers: { 'x-csrf-token': csrf.value ?? '' },
      credentials: 'include',
      body: payload,
    })
    formState.success = 'Gespeichert.'
    await refresh()
  } catch (err: any) {
    formState.error = err?.message || err?.data?.message || 'Speichern fehlgeschlagen.'
  } finally {
    formState.updating = false
  }
}

function createError(message: string) {
  const error = new Error(message)
  ;(error as any).data = { message }
  return error
}

async function fetchUserSearch() {
  const query = searchTerm.value.trim()
  if (query.length < 2) {
    searchPending.value = false
    searchResults.value = []
    return
  }
  try {
    const res = await $fetch<{ users: typeof searchResults.value }>('/api/team/user-search', {
      credentials: 'include',
      params: { q: query, limit: 8 },
    })
    const invitedIds = new Set(
      (team.value?.invites ?? [])
        .map((invite) => invite.targetUser?.id)
        .filter((id): id is string => Boolean(id)),
    )
    searchResults.value = res.users.filter((user) => !invitedIds.has(user.id))
  } catch (err) {
    console.error('Suche fehlgeschlagen', err)
    searchResults.value = []
  } finally {
    searchPending.value = false
  }
}

async function inviteUser(user: { id: string; name: string; nameId: string; email: string; image: string | null }) {
  userInviteLoading[user.id] = true
  try {
    await $fetch('/api/team/invite', {
      method: 'POST',
      headers: { 'x-csrf-token': csrf.value ?? '' },
      credentials: 'include',
      body: { userId: user.id },
    })
    searchResults.value = searchResults.value.filter((entry) => entry.id !== user.id)
    await refresh()
  } catch (err: any) {
    console.error('Direkte Einladung fehlgeschlagen', err)
  } finally {
    userInviteLoading[user.id] = false
  }
}

async function approveRequest(id: string) {
  requestActions[id] = { ...(requestActions[id] ?? {}), approve: true }
  try {
    await $fetch(`/api/team/requests/${id}/approve`, {
      method: 'POST',
      headers: { 'x-csrf-token': csrf.value ?? '' },
      credentials: 'include',
    })
    await refresh()
  } catch (err: any) {
    console.error('Anfrage bestätigen fehlgeschlagen', err)
  } finally {
    requestActions[id] = { ...(requestActions[id] ?? {}), approve: false }
  }
}

async function declineRequest(id: string) {
  requestActions[id] = { ...(requestActions[id] ?? {}), decline: true }
  try {
    await $fetch(`/api/team/requests/${id}/decline`, {
      method: 'POST',
      headers: { 'x-csrf-token': csrf.value ?? '' },
      credentials: 'include',
    })
    await refresh()
  } catch (err: any) {
    console.error('Anfrage ablehnen fehlgeschlagen', err)
  } finally {
    requestActions[id] = { ...(requestActions[id] ?? {}), decline: false }
  }
}

async function removeMember(id: string) {
  memberActions[id] = true
  try {
    await $fetch(`/api/team/members/${id}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': csrf.value ?? '' },
      credentials: 'include',
    })
    await refresh()
  } catch (err: any) {
    console.error('Mitglied entfernen fehlgeschlagen', err)
  } finally {
    memberActions[id] = false
  }
}

async function createInvite() {
  if (!team.value) return
  inviteState.loading = true
  inviteState.error = ''
  inviteState.success = ''
  try {
    await $fetch('/api/team/invite', {
      method: 'POST',
      headers: { 'x-csrf-token': csrf.value ?? '' },
      credentials: 'include',
      body: {
        email: inviteForm.email || null,
        note: inviteForm.note || null,
        expiresInDays: inviteForm.expiresInDays,
      },
    })
    inviteState.success = 'Einladung erstellt.'
    inviteForm.email = ''
    inviteForm.note = ''
    inviteForm.expiresInDays = 7
    await refresh()
  } catch (err: any) {
    inviteState.error = err?.data?.message || err?.message || 'Einladung konnte nicht erstellt werden.'
  } finally {
    inviteState.loading = false
  }
}

async function deleteInvite(id: string) {
  inviteRemovals[id] = true
  try {
    await $fetch(`/api/team/invite/${id}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': csrf.value ?? '' },
      credentials: 'include',
    })
    await refresh()
  } catch (err: any) {
    console.error('Einladung löschen fehlgeschlagen', err)
  } finally {
    inviteRemovals[id] = false
  }
}

async function deleteTeam() {
  if (deleteState.loading) return
  const confirmed = window.confirm('Möchtest du dieses Team wirklich dauerhaft löschen? Diese Aktion kann nicht rückgängig gemacht werden.')
  if (!confirmed) return

  deleteState.loading = true
  deleteState.error = ''

  try {
    await $fetch('/api/team/delete', {
      method: 'POST',
      headers: { 'x-csrf-token': csrf.value ?? '' },
      credentials: 'include',
    })
    setAuthTeam(null)
    await router.push('/team/discover')
  } catch (err: any) {
    console.error('Team löschen fehlgeschlagen', err)
    deleteState.error = err?.data?.message || err?.message || 'Team konnte nicht gelöscht werden.'
  } finally {
    deleteState.loading = false
  }
}
</script>
