<template>
  <div class="px-4 py-20">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <ProfileHero
        v-if="authUser"
        :user="{ name: authUser.name, nameId: authUser.nameId, email: authUser.email, image: avatarPreview, bio: settingsForm.bio }"
        :team="teamInfo"
        @edit-profile="scrollToSettings"
        @change-picture="triggerAvatarUpload"
        @manage-team="openTeamManagement"
        @open-post-composer="scrollToComposer"
      />

      <ProfileStatsGrid :stats="stats" />

      <div class="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
        <div class="space-y-6">
          <div id="composer-anchor">
            <ProfilePostComposer
              v-model="postComposerForm"
              :loading="postComposerState.loading"
              :error-message="postComposerState.error"
              :success-message="postComposerState.success"
              @submit="handlePostSubmit"
              @save-draft="handlePostDraft"
              @open-media-library="openMediaLibrary"
            />
          </div>

          <ProfilePostsCard
            :posts="posts"
            @open="openPost"
            @edit="editPost"
            @delete="deletePost"
            @compose="scrollToComposer"
          />

          <div class="grid gap-6 lg:grid-cols-2">
            <ProfileChallengesCard :challenges="challenges" @create-challenge="createChallenge" />
            <ProfileTeamCard
              :team="teamInfo"
              @open-team="openTeamManagement"
              @open-messages="openTeamMessages"
              @leave-team="leaveTeam"
              @discover-team="discoverTeams"
              @create-team="createTeam"
            />
          </div>
        </div>

        <div class="space-y-6" ref="sidebarRef">
          <ProfileAvatarCard
            v-if="authUser"
            :user="authUser"
            :preview="avatarPreview"
            :error="avatarState.error"
            @select-picture="handleAvatarSelect"
            @remove-picture="removeAvatar"
            @error="setAvatarError"
          />

          <ProfileSettingsForm
            v-model="settingsForm"
            :loading="settingsState.loading"
            @form="handleSettingsSubmit"
          />

          <ProfilePasswordCard
            v-model="passwordForm"
            :loading="passwordState.loading"
            :error-message="passwordState.error"
            :success-message="passwordState.success"
            @submit="handlePasswordSubmit"
          />

          <ProfileDonationCard
            v-model="donationSettings"
            :loading="donationState.loading"
            @save="handleDonationSave"
            @view-history="openDonationHistory"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthUser } from '../../composables/useAuthUser'
import { useCookie } from 'nuxt/app'
import ProfileHero from '../../components/profile/ProfileHero.vue'
import ProfileStatsGrid, { type ProfileStat } from '../../components/profile/ProfileStatsGrid.vue'
import type {
  PostComposerForm,
  PostComposerSubmitPayload
} from '../../components/profile/ProfilePostComposer.vue'
import ProfilePostsCard, { type PostSummary } from '../../components/profile/ProfilePostsCard.vue'
import ProfileAvatarCard from '../../components/profile/ProfileAvatarCard.vue'
import ProfileSettingsForm from '../../components/profile/ProfileSettingsForm.vue'
import ProfilePasswordCard from '../../components/profile/ProfilePasswordCard.vue'
import ProfileDonationCard from '../../components/profile/ProfileDonationCard.vue'
import ProfileChallengesCard, { type ChallengeSummary } from '../../components/profile/ProfileChallengesCard.vue'
import ProfileTeamCard, { type TeamInfo } from '../../components/profile/ProfileTeamCard.vue'

const router = useRouter()
const authUser = useAuthUser()

const sidebarRef = ref<HTMLElement | null>(null)

const stats = computed<ProfileStat[]>(() => [
  { label: 'Gelaufene Kilometer', value: '342 km', hint: 'Diese Saison', icon: 'ph:road-horizon-duotone' },
  { label: 'Gesamtzeit', value: '41 h 26 min', hint: 'Trainingszeit', icon: 'ph:timer-duotone' },
  { label: 'Ø Pace', value: '5:12 min/km', hint: 'Letzte 4 Wochen', icon: 'ph:chart-line-duotone' },
  { label: 'Aktive Serien', value: '12 Tage', hint: 'Ohne Pausentag', icon: 'ph:fire-duotone' },
])

const posts = ref<PostSummary[]>([])


const challenges = ref<ChallengeSummary[]>([])

const teamInfo = ref<TeamInfo>({
  name: 'PaceMakers Munich',
  description: 'Wir trainieren für Halbmarathon- und Marathonrennen in ganz Europa.',
  roleLabel: 'Team Captain',
  members: 18,
  location: 'München',
})

type Visibility = 'public' | 'protected' | 'private'

const postComposerForm = reactive<PostComposerForm>({
  title: '',
  content: '',
  visibility: 'public',
  distanceKm: '',
  duration: '',
  garminActivityId: '',           
  createdAt: new Date().toISOString(),
})

const postComposerState = reactive({
  loading: false,
  error: '',
  success: '',
})

interface ProfileSettings {
  name: string
  email: string
  bio: string
  visibility: Visibility
  notifications: boolean
  updatedAt: string | Date | undefined
}

const settingsForm = reactive<ProfileSettings>({
  name: authUser.value?.name ?? '',
  email: authUser.value?.email ?? '',
  bio: authUser.value?.bio ?? '',
  visibility: 'protected' as Visibility,
  notifications: true,
  updatedAt: new Date().toISOString(),
})

const settingsState = reactive({ loading: false })

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const passwordState = reactive({
  loading: false,
  success: '',
  error: '',
})

const donationSettings = reactive({
  amount: 5,
  autoDonate: true,
  updatedAt: new Date().toISOString(),
})

const donationState = reactive({ loading: false })

const avatarPreview = ref<string | null>(null)
const avatarState = reactive({ error: '' })

function scrollToSettings() {
  sidebarRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function scrollToComposer() {
  document.getElementById('composer-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function triggerAvatarUpload() {
  sidebarRef.value?.querySelector('button')?.click()
}

function openTeamManagement() {
  router.push('/team/manage')
}

function openTeamMessages() {
  router.push('/team/messages')
}

function createTeam() {
  router.push('/team/create')
}

function discoverTeams() {
  router.push('/team/discover')
}

function leaveTeam() {
  teamInfo.value = null
}

function openMediaLibrary() {
  postComposerState.error = 'Medienbibliothek folgt in Kürze.'
}

async function handlePostSubmit(form: PostComposerSubmitPayload) {
  postComposerState.loading = true
  postComposerState.error = ''
  postComposerState.success = ''

  try {
    const csrf = useCookie('csrf_token').value
    const newPost = await $fetch('/api/profile/posts', {
      method: 'POST',
      headers: { 'x-csrf-token': csrf ?? '' },
      body: {
        content: form.content,
        visibility: form.visibility,
        image: null,
        distanceInMeters: form.distanceInMeters,
        durationInSeconds: form.durationInSeconds,
        garminActivityId: form.garminActivityId || null
      },
    }) as PostSummary & {
      distanceInMeters?: number | null
      durationInSeconds?: number | null
    }

    posts.value.unshift({
      id: newPost.id,
      title: form.title || 'Neuer Beitrag',
      excerpt: form.content.slice(0, 160),
      createdAt: newPost.createdAt,
      visibility: newPost.visibility,
      reactions: newPost.reactions,
      comments: newPost.comments,
      distanceInMeters: newPost.distanceInMeters ?? form.distanceInMeters ?? null,
      durationInSeconds: newPost.durationInSeconds ?? form.durationInSeconds ?? null,
    })

    postComposerState.success = 'Beitrag gespeichert.'
    postComposerForm.title = ''
    postComposerForm.content = ''
    postComposerForm.distanceKm = ''
    postComposerForm.duration = ''
  } catch (err: any) {
    postComposerState.error = err?.data?.message || 'Fehler beim Speichern.'
  } finally {
    postComposerState.loading = false
  }
}

function handlePostDraft() {
  postComposerState.success = 'Entwurf gespeichert (lokal).'
}

function openPost(id: string) {
  router.push(`/postings/${id}`)
}

function editPost(id: string) {
  router.push(`/postings/${id}/edit`)
}

function deletePost(id: string) {
  posts.value = posts.value.filter((post) => post.id !== id)
}

function handleSettingsSubmit(form: typeof settingsForm) {
  settingsState.loading = true
  setTimeout(() => {
    settingsState.loading = false
    settingsForm.updatedAt = new Date().toISOString()
  }, 800)
}

function handlePasswordSubmit(form: typeof passwordForm) {
  passwordState.loading = true
  passwordState.error = ''
  passwordState.success = ''

  if (form.newPassword !== form.confirmPassword) {
    passwordState.loading = false
    passwordState.error = 'Passwörter stimmen nicht überein.'
    return
  }

  setTimeout(() => {
    passwordState.loading = false
    passwordState.success = 'Passwort aktualisiert.'
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  }, 1000)
}

function handleDonationSave() {
  donationState.loading = true
  setTimeout(() => {
    donationState.loading = false
    donationSettings.updatedAt = new Date().toISOString()
  }, 600)
}

function openDonationHistory() {
  router.push('/donations/history')
}

function handleAvatarSelect(file: File | null) {
  if (!file) {
    avatarPreview.value = null
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    avatarPreview.value = String(reader.result)
  }
  reader.readAsDataURL(file)
}

function removeAvatar() {
  avatarPreview.value = null
}

function setAvatarError(message?: string) {
  avatarState.error = message || ''
}

function createChallenge() {
  router.push('/challenges/create')
}
</script>
