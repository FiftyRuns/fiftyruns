// app/pages/profile/useProfilePage.ts
import { reactive, ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCookie } from 'nuxt/app'
import { useAuthUser } from '../../composables/useAuthUser'

// Komponenten-Typen
import type { ProfileStat } from '../../components/profile/ProfileStatsGrid.vue'
import type { PostComposerForm, PostComposerSubmitPayload } from '../../components/profile/ProfilePostComposer.vue'
import type { PostSummary } from '../../components/profile/ProfilePostsCard.vue'
import type { ChallengeSummary } from '../../components/profile/ProfileChallengesCard.vue'
import type { TeamInfo } from '../../components/profile/ProfileTeamCard.vue'
type SubmitWithImage = PostComposerSubmitPayload & {
  imageUrl?: string | null
}

// ZENTRALE Typen (einheitlich verwenden!)
import type {
  Visibility,
  ProfileSettings,
  DonationSettings,
  PasswordForm,
} from '../../types/profile'

export function useProfilePage() {
  const router = useRouter()
  const authUser = useAuthUser()

  const sidebarRef = ref<HTMLElement | null>(null)

  const stats = ref<ProfileStat[]>([])
  const posts = ref<PostSummary[]>([])
  const challenges = ref<ChallengeSummary[]>([])
  const teamInfo = ref<TeamInfo | null>(null)

  // Post-Composer
  const postComposerForm = reactive<PostComposerForm>({
    title: '',
    content: '',
    visibility: 'public',
    distanceKm: '',
    duration: '',
    garminActivityId: '',
    createdAt: new Date().toISOString(),
  })
  const postComposerState = reactive({ loading: false, error: '', success: '' })

  // Settings-States
  const settingsForm = reactive<ProfileSettings>({
    name: authUser.value?.name ?? '',
    email: authUser.value?.email ?? '',
    bio: authUser.value?.bio ?? '',
    visibility: 'protected',
    notifications: true,
    updatedAt: new Date().toISOString(), // zentral als string
  })
  const settingsState = reactive({ loading: false })

  const passwordForm = reactive<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const passwordState = reactive({ loading: false, success: '', error: '' })

  const donationSettings = reactive<DonationSettings>({
    amount: 5,
    autoDonate: true,
    updatedAt: new Date().toISOString(), // zentral als string
  })
  const donationState = reactive({ loading: false })

  // Avatar
  const avatarPreview = ref<string | null>(authUser.value?.image ?? null)
  watch(
    authUser,
    (val) => {
      if (!val) return
      if (!avatarPreview.value) {
        avatarPreview.value = val.image ?? null
      }
    },
    { immediate: false }
  )
  const avatarState = reactive({ error: '' })

  onMounted(async () => {
    await Promise.all([loadOverview(), loadPosts()])
    // Optional: await loadChallenges()
  })

  async function loadOverview() {
    try {
      const data = await $fetch<{ team: TeamInfo | null; stats: ProfileStat[] }>('/api/profile/overview', {
        credentials: 'include',
      })
      teamInfo.value = data.team
      stats.value = data.stats
    } catch (e) {
      console.error('Profil-Overview fehlgeschlagen', e)
    }
  }

  async function loadPosts(cursor?: string) {
    try {
      const data = await $fetch<{
        items: Array<{
          id: string
          createdAt: string
          text: string
          visibility: Visibility
          reactions: number
          comments: number
          distanceInMeters?: number | null
          durationInSeconds?: number | null
          image?: string | null
        }>
        nextCursor: string | null
      }>('/api/profile/posts', { params: { take: 20, cursor }, credentials: 'include' })

      posts.value = data.items.map((p) => ({
        id: p.id,
        title: (p.text || '').slice(0, 60) || 'Beitrag',
        content: p.text || '',
        createdAt: p.createdAt,
        visibility: p.visibility,
        reactions: p.reactions,
        comments: p.comments,
        distanceInMeters: p.distanceInMeters ?? null,
        durationInSeconds: p.durationInSeconds ?? null,
        image: (p as any).image ?? null,
      }))
      // Optional: nextCursor handling
    } catch (e) {
      console.error('Posts laden fehlgeschlagen', e)
    }
  }

  async function loadChallenges() {
    try {
      const data = await $fetch<ChallengeSummary[]>('/api/profile/challenges', { credentials: 'include' })
      challenges.value = data
    } catch (e) {
      console.error('Challenges laden fehlgeschlagen', e)
    }
  }

  function goToSettings() {
    router.push('/profile/settings')
  }

  function scrollToComposer() {
    if (process.client) {
      document.getElementById('composer-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
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

  async function createTeam() {
    try {
      const csrf = useCookie('csrf_token').value
      await $fetch('/api/team/create', {
        method: 'POST',
        headers: { 'x-csrf-token': csrf ?? '' },
        body: {
          name: 'Mein Team',
          nameId: 'mein-team',
          description: 'Wir laufen zusammen.',
          location: 'München',
        },
        credentials: 'include',
      })
      await loadOverview()
    } catch (e) {
      console.error('Team erstellen fehlgeschlagen', e)
    }
  }

  function discoverTeams() {
    router.push('/team/discover')
  }

  async function joinTeam(nameId: string) {
    try {
      const csrf = useCookie('csrf_token').value
      await $fetch('/api/team/join', {
        method: 'POST',
        headers: { 'x-csrf-token': csrf ?? '' },
        body: { nameId },
        credentials: 'include',
      })
      await loadOverview()
    } catch (e) {
      console.error('Team beitreten fehlgeschlagen', e)
    }
  }

  async function leaveTeam() {
    try {
      const csrf = useCookie('csrf_token').value
      await $fetch('/api/team/leave', {
        method: 'POST',
        headers: { 'x-csrf-token': csrf ?? '' },
        credentials: 'include',
      })
      await loadOverview()
    } catch (e) {
      console.error('Team verlassen fehlgeschlagen', e)
    }
  }

  function openMediaLibrary() {
    postComposerState.error = 'Medienbibliothek folgt in Kürze.'
  }

  // ==== v-model Handler ====
  function onPostComposerUpdate(val: PostComposerForm) {
    Object.assign(postComposerForm, val)
  }
  function onSettingsUpdate(val: ProfileSettings) {
    Object.assign(settingsForm, val)
  }
  function onPasswordUpdate(val: PasswordForm) {
    Object.assign(passwordForm, val)
  }
  function onDonationUpdate(val: DonationSettings) {
    Object.assign(donationSettings, val)
  }

  // ==== Post erstellen (inkl. RunningExercise/RunningStatistic am Server) ====
  async function handlePostSubmit(form: SubmitWithImage) {
    postComposerState.loading = true
    postComposerState.error = ''
    postComposerState.success = ''
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
      await Promise.all([loadPosts(), loadOverview()])
      postComposerState.success = 'Beitrag gespeichert.'
      postComposerForm.title = postComposerForm.content = postComposerForm.distanceKm = postComposerForm.duration = ''
    } catch (err: any) {
      postComposerState.error = err?.data?.message || err?.message || 'Fehler beim Speichern.'
    } finally {
      postComposerState.loading = false
    }
  }

  // ==== Post-Card Aktionen ====
  function openPost(id: string) {
    router.push(`/postings/${id}`)
  }
  function editPost(id: string) {
    router.push(`/postings/${id}/edit`)
  }
  async function deletePost(id: string) {
    try {
      const csrf = useCookie('csrf_token').value
      await $fetch(`/api/profile/posts/${id}`, {
        method: 'DELETE',
        headers: { 'x-csrf-token': csrf ?? '' },
        credentials: 'include',
      })
      await Promise.all([loadPosts(), loadOverview()])
    } catch (e: any) {
      console.error('Post löschen fehlgeschlagen', e)
    }
  }

  function handleSettingsSubmit(form: ProfileSettings) {
    settingsState.loading = true
    setTimeout(() => {
      settingsState.loading = false
      settingsForm.updatedAt = new Date().toISOString()
    }, 800)
  }

  function handlePasswordSubmit(form: PasswordForm) {
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

  // ==== Avatar ====
  function handleAvatarSelect(file: File | null) {
    if (!file) {
      avatarPreview.value = authUser.value?.image ?? null
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
    if (authUser.value) {
      authUser.value.image = null
    }
  }
  function setAvatarError(message?: string) {
    avatarState.error = message || ''
  }
  async function handleAvatarSaved(url: string | null) {
    const previous = authUser.value?.image ?? null
    avatarPreview.value = url
    if (authUser.value) {
      authUser.value.image = url ?? null
    }

    if (!url) {
      // Entfernen wird bereits über /api/blob.delete abgewickelt
      return
    }

    try {
      const csrf = useCookie('csrf_token').value || ''
      await $fetch('/api/profile/avatar', {
        method: 'PATCH',
        headers: { 'x-csrf-token': csrf },
        body: { imageUrl: url, previousUrl: previous },
        credentials: 'include',
      })
      avatarState.error = ''
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Profilbild konnte nicht gespeichert werden.'
      avatarState.error = message
      avatarPreview.value = previous
      if (authUser.value) {
        authUser.value.image = previous
      }
    }
  }

  function createChallenge() {
    router.push('/challenges/create')
  }

  return {
    authUser,
    sidebarRef,
    stats,
    posts,
    challenges,
    teamInfo,

    postComposerForm,
    postComposerState,

    settingsForm,
    settingsState,

    passwordForm,
    passwordState,

    donationSettings,
    donationState,

    avatarPreview,
    avatarState,

    // UI-Helpers
    goToSettings,
    scrollToComposer,
    triggerAvatarUpload,

    // Navigation / Team
    openTeamManagement,
    openTeamMessages,
    createTeam,
    discoverTeams,
    joinTeam,
    leaveTeam,

    // Media
    openMediaLibrary,

    // v-model Handler
    onPostComposerUpdate,
    onSettingsUpdate,
    onPasswordUpdate,
    onDonationUpdate,

    // Actions
    handlePostSubmit,
    openPost,
    editPost,
    deletePost,
    handleSettingsSubmit,
    handlePasswordSubmit,
    handleDonationSave,
    openDonationHistory,
    handleAvatarSelect,
    removeAvatar,
    setAvatarError,
    handleAvatarSaved,
    createChallenge,
  }
}
