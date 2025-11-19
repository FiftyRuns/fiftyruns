// app/pages/profile/useProfilePage.ts
import { reactive, ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCookie } from 'nuxt/app'
import { useAuthUser } from '../../composables/useAuthUser'
import { setAuthTeam } from '../../composables/useAuthTeam'
import { useToast } from '../../composables/useToast'

// Komponenten-Typen
import type { ProfileStat } from '../../components/profile/ProfileStatsGrid.vue'
import type { PostComposerForm, PostComposerSubmitPayload } from '../../components/profile/ProfilePostComposer.vue'
import type { PostSummary } from '../../components/profile/ProfilePostsCard.vue'
import type { ChallengeSummary } from '../../components/profile/ProfileChallengesCard.vue'
import type { TeamInfo } from '../../components/profile/ProfileTeamCard.vue'

// ZENTRALE Typen (einheitlich verwenden!)
import type {
  Visibility,
  ProfileSettings,
  DonationSettings,
  PasswordForm,
  ProfileMeResponse,
} from '../../types/profile'

type SubmitWithImage = PostComposerSubmitPayload & {
  imageUrl?: string | null
}

export function useProfilePage() {
  const router = useRouter()
  const route = useRoute()
  const authUser = useAuthUser()
  const { showSuccess, showError } = useToast()

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
  const settingsState = reactive({ loading: false, success: '', error: '' })

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
  const donationState = reactive({ loading: false, success: '', error: '' })

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

  const stravaIntegration = reactive({
    connected: false,
    athleteId: null as string | null,
    scopes: [] as string[],
    connectedAt: null as string | null,
    tokenExpiresAt: null as string | null,
    deauthorizedAt: null as string | null,
  })
  const stravaState = reactive({ loading: false, error: '' })

  const garminIntegration = reactive({
    connected: false,
    userId: null as string | null,
    connectedAt: null as string | null,
    tokenExpiresAt: null as string | null,
  })
  const garminState = reactive({ loading: false, error: '' })

  onMounted(async () => {
    if (!authUser.value) {
      router.push('/login')
      return
    }
    await Promise.all([loadProfileData(), loadOverview(), loadPosts(), loadChallenges()])
    handleStravaCallback()
    handleGarminCallback()
  })

  async function loadProfileData() {
    try {
      const data = await $fetch<ProfileMeResponse>('/api/profile/me', { credentials: 'include' })

      const bio = (data.settings.bio ?? '').trim()
      const visibility = data.settings.visibility ?? 'protected'
      const notifications = data.settings.notifications ?? true

      settingsForm.name = data.user.name
      settingsForm.email = data.user.email
      settingsForm.bio = bio
      settingsForm.visibility = visibility
      settingsForm.notifications = notifications
      settingsForm.updatedAt = data.settings.updatedAt ?? settingsForm.updatedAt

      const donationAmount = data.donation.amount
      if ([1, 2, 5, 10].includes(donationAmount)) {
        donationSettings.amount = donationAmount
      }
      donationSettings.autoDonate = Boolean(data.donation.autoDonate)
      donationSettings.updatedAt = data.donation.updatedAt ?? donationSettings.updatedAt

      avatarPreview.value = data.user.image ?? null

      authUser.value = {
        id: data.user.id,
        name: data.user.name,
        nameId: data.user.nameId,
        email: data.user.email,
        bio,
        image: data.user.image ?? null,
      }

      if (data.integrations?.strava) {
        const strava = data.integrations.strava
        stravaIntegration.connected = Boolean(strava.connected)
        stravaIntegration.athleteId = strava.athleteId
        stravaIntegration.scopes = Array.isArray(strava.scopes) ? strava.scopes : []
        stravaIntegration.connectedAt = strava.connectedAt
        stravaIntegration.tokenExpiresAt = strava.tokenExpiresAt
        stravaIntegration.deauthorizedAt = strava.deauthorizedAt
      } else {
        resetStravaIntegration()
      }

      if (data.integrations?.garmin) {
        const garmin = data.integrations.garmin
        garminIntegration.connected = Boolean(garmin.connected)
        garminIntegration.userId = garmin.userId
        garminIntegration.connectedAt = garmin.connectedAt
        garminIntegration.tokenExpiresAt = garmin.tokenExpiresAt
      } else {
        resetGarminIntegration()
      }
    } catch (e) {
      if (process.dev) {
        console.error('[profile] Profil-Daten laden fehlgeschlagen', e)
      }
      resetStravaIntegration()
      resetGarminIntegration()
    }
  }

  function resetStravaIntegration() {
    stravaIntegration.connected = false
    stravaIntegration.athleteId = null
    stravaIntegration.scopes = []
    stravaIntegration.connectedAt = null
    stravaIntegration.tokenExpiresAt = null
    stravaIntegration.deauthorizedAt = null
  }

  function resetGarminIntegration() {
    garminIntegration.connected = false
    garminIntegration.userId = null
    garminIntegration.connectedAt = null
    garminIntegration.tokenExpiresAt = null
  }

  function handleStravaCallback() {
    const statusParam = route.query?.strava
    const status = Array.isArray(statusParam) ? statusParam[0] : statusParam
    if (!status) return

    const messages: Record<string, () => void> = {
      connected: () => showSuccess('Strava erfolgreich verbunden.'),
      cancelled: () => showError('Strava-Verknüpfung wurde abgebrochen.'),
      invalid_state: () => showError('Sicherheitsprüfung fehlgeschlagen. Bitte erneut versuchen.'),
      token_error: () => showError('Strava-Tokens konnten nicht abgerufen werden.'),
      persist_error: () => showError('Strava-Daten konnten nicht gespeichert werden.'),
      unauthorized: () => showError('Bitte melde dich an, um Strava zu verbinden.'),
    }

    const handler = messages[status] ?? (() => showError('Strava-Verknüpfung fehlgeschlagen.'))
    handler()

    const nextQuery = { ...route.query }
    delete nextQuery.strava
    router.replace({ query: nextQuery }).catch(() => {})
  }

  function handleGarminCallback() {
    const statusParam = route.query?.garmin
    const status = Array.isArray(statusParam) ? statusParam[0] : statusParam
    if (!status) return

    const messages: Record<string, () => void> = {
      connected: () => showSuccess('Garmin erfolgreich verbunden.'),
      cancelled: () => showError('Garmin-Verknüpfung wurde abgebrochen.'),
      invalid_state: () => showError('Sicherheitsprüfung fehlgeschlagen. Bitte erneut versuchen.'),
      token_error: () => showError('Garmin-Tokens konnten nicht abgerufen werden.'),
      userid_error: () => showError('Garmin User-ID konnte nicht abgerufen werden.'),
      persist_error: () => showError('Garmin-Daten konnten nicht gespeichert werden.'),
      unauthorized: () => showError('Bitte melde dich an, um Garmin zu verbinden.'),
    }

    const handler = messages[status] ?? (() => showError('Garmin-Verknüpfung fehlgeschlagen.'))
    handler()

    const nextQuery = { ...route.query }
    delete nextQuery.garmin
    router.replace({ query: nextQuery }).catch(() => {})

    // Profil-Daten neu laden, um aktualisierten Status anzuzeigen
    loadProfileData().catch(() => {})
  }

  async function connectStrava() {
    stravaState.loading = true
    stravaState.error = ''
    try {
      const result = await $fetch<{ url: string }>('/api/strava/connect', { credentials: 'include' })
      if (!result?.url) {
        throw new Error('Weiterleitungsadresse fehlt.')
      }
      window.location.href = result.url
    } catch (err) {
      stravaState.error = 'Strava-Verbindung konnte nicht gestartet werden.'
      showError(stravaState.error)
    } finally {
      stravaState.loading = false
    }
  }

  async function disconnectStrava() {
    stravaState.loading = true
    stravaState.error = ''
    try {
      await $fetch('/api/strava/disconnect', {
        method: 'POST',
        credentials: 'include',
      })
      resetStravaIntegration()
      showSuccess('Strava-Verbindung wurde getrennt.')
    } catch (err) {
      stravaState.error = 'Strava konnte nicht getrennt werden.'
      showError(stravaState.error)
    } finally {
      stravaState.loading = false
    }
  }

  async function connectGarmin() {
    garminState.loading = true
    garminState.error = ''
    try {
      const result = await $fetch<{ url: string }>('/api/garmin/connect', { credentials: 'include' })
      if (!result?.url) {
        throw new Error('Weiterleitungsadresse fehlt.')
      }
      window.location.href = result.url
    } catch (err) {
      garminState.error = 'Garmin-Verbindung konnte nicht gestartet werden.'
      showError(garminState.error)
    } finally {
      garminState.loading = false
    }
  }

  async function disconnectGarmin() {
    garminState.loading = true
    garminState.error = ''
    try {
      await $fetch('/api/garmin/disconnect', {
        method: 'POST',
        credentials: 'include',
      })
      resetGarminIntegration()
      showSuccess('Garmin-Verbindung wurde getrennt.')
    } catch (err) {
      garminState.error = 'Garmin konnte nicht getrennt werden.'
      showError(garminState.error)
    } finally {
      garminState.loading = false
    }
  }

  async function loadOverview() {
    try {
      const data = await $fetch<{ team: TeamInfo | null; stats: ProfileStat[] }>('/api/profile/overview', {
        credentials: 'include',
      })
      teamInfo.value = data.team
      stats.value = data.stats
      setAuthTeam(
        data.team
          ? {
              id: data.team.id,
              name: data.team.name,
              nameId: data.team.nameId,
              roleLabel: data.team.roleLabel ?? null,
            }
          : null,
      )
    } catch (e) {
      if (process.dev) {
        console.error('[profile] Profil-Overview fehlgeschlagen', e)
      }
      setAuthTeam(null)
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
          source?: 'MANUAL' | 'GARMIN' | 'STRAVA' | null
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
        image: p.image ?? null,
        source: p.source ?? null,
      }))
      // Optional: nextCursor handling
    } catch (e) {
      if (process.dev) {
        console.error('[profile] Posts laden fehlgeschlagen', e)
      }
    }
  }

  async function loadChallenges() {
    try {
      const data = await $fetch<ChallengeSummary[]>('/api/profile/challenges', { credentials: 'include' })
      challenges.value = data
    } catch (e) {
      if (process.dev) {
        console.error('[profile] Challenges laden fehlgeschlagen', e)
      }
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

  function openTeamOverview() {
    const nameId = teamInfo.value?.nameId
    if (nameId) {
      router.push(`/team/${nameId}`)
    } else {
      router.push('/team/discover')
    }
  }

  async function createTeam() {
    router.push('/team/create')
  }

  function discoverTeams() {
    router.push('/team/discover')
  }

  async function joinTeam(nameId: string) {
    try {
      const csrf = useCookie('csrf_token').value
      await $fetch('/api/team/requests', {
        method: 'POST',
        headers: { 'x-csrf-token': csrf ?? '' },
        body: { nameId },
        credentials: 'include',
      })
      await loadOverview()
    } catch (e) {
      if (process.dev) {
        console.error('[profile] Team beitreten fehlgeschlagen', e)
      }
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
      setAuthTeam(null)
      await loadOverview()
    } catch (e) {
      if (process.dev) {
        console.error('[profile] Team verlassen fehlgeschlagen', e)
      }
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
    settingsState.success = ''
    settingsState.error = ''
    Object.assign(settingsForm, val)
  }
  function onPasswordUpdate(val: PasswordForm) {
    passwordState.success = ''
    passwordState.error = ''
    Object.assign(passwordForm, val)
  }
  function onDonationUpdate(val: DonationSettings) {
    donationState.success = ''
    donationState.error = ''
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
      showSuccess('Beitrag erfolgreich veröffentlicht!')
      postComposerForm.title = postComposerForm.content = postComposerForm.distanceKm = postComposerForm.duration = ''
    } catch (err: any) {
      if (process.dev) {
        console.error('[useProfilePage] Post submit failed', err)
      }
      showError(err?.data?.message || err?.message || 'Fehler beim Speichern.')
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
      if (process.dev) {
        console.error('[profile] Post löschen fehlgeschlagen', e)
      }
    }
  }

  async function handleSettingsSubmit(form: ProfileSettings) {
    settingsState.loading = true
    settingsState.success = ''
    settingsState.error = ''

    const name = form.name.trim()
    const email = form.email.trim().toLowerCase()
    const bio = form.bio.trim()

    try {
      const csrf = useCookie('csrf_token').value ?? ''
      await $fetch('/api/profile/settings', {
        method: 'PATCH',
        headers: { 'x-csrf-token': csrf },
        credentials: 'include',
        body: {
          name,
          email,
          bio,
          visibility: form.visibility,
          notifications: form.notifications,
        },
      })

      settingsForm.name = name
      settingsForm.email = email
      settingsForm.bio = bio
      settingsForm.visibility = form.visibility
      settingsForm.notifications = form.notifications
      settingsForm.updatedAt = new Date().toISOString()

      if (authUser.value) {
        authUser.value.name = name
        authUser.value.email = email
        authUser.value.bio = bio
      }

      settingsState.success = 'Profil gespeichert.'
    } catch (err: any) {
      settingsState.error =
        err?.data?.message || err?.message || 'Profil konnte nicht gespeichert werden.'
    } finally {
      settingsState.loading = false
    }
  }

  async function handlePasswordSubmit(form: PasswordForm) {
    passwordState.loading = true
    passwordState.error = ''
    passwordState.success = ''

    if (form.newPassword !== form.confirmPassword) {
      passwordState.loading = false
      passwordState.error = 'Passwörter stimmen nicht überein.'
      return
    }

    try {
      const csrf = useCookie('csrf_token').value ?? ''
      await $fetch('/api/profile/password', {
        method: 'PATCH',
        headers: { 'x-csrf-token': csrf },
        credentials: 'include',
        body: {
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        },
      })

      passwordState.success = 'Passwort aktualisiert.'
      passwordForm.currentPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
    } catch (err: any) {
      passwordState.error =
        err?.data?.message || err?.message || 'Passwort konnte nicht aktualisiert werden.'
    } finally {
      passwordState.loading = false
    }
  }

  async function handleDonationSave() {
    donationState.loading = true
    donationState.success = ''
    donationState.error = ''

    try {
      const csrf = useCookie('csrf_token').value ?? ''
      await $fetch('/api/profile/donation', {
        method: 'PATCH',
        headers: { 'x-csrf-token': csrf },
        credentials: 'include',
        body: {
          amount: donationSettings.amount,
          autoDonate: donationSettings.autoDonate,
        },
      })

      donationSettings.updatedAt = new Date().toISOString()
      donationState.success = 'Spendenplan gespeichert.'
    } catch (err: any) {
      donationState.error =
        err?.data?.message || err?.message || 'Spendenplan konnte nicht gespeichert werden.'
    } finally {
      donationState.loading = false
    }
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
    openTeamOverview,
    openTeamManagement,
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
    stravaIntegration,
    stravaState,
    garminIntegration,
    garminState,
    connectStrava,
    disconnectStrava,
    connectGarmin,
    disconnectGarmin,
    createChallenge,
  }
}
