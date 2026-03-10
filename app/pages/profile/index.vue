<template>
  <div class="px-4 py-20">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <ProfileHero v-if="authUser"
        :user="{
          name: authUser.name,
          nameId: authUser.nameId,
          email: authUser.email,
          image: avatarPreview || authUser.image,
          bio: settingsForm.bio
        }"
        :strava="stravaIntegration"
        :strava-state="stravaState"
        :garmin="garminIntegration"
        :garmin-state="garminState"
        @edit-profile="goToSettings"
        @change-picture="triggerAvatarUpload"
        @open-post-composer="scrollToComposer"
        @connect-strava="connectStrava"
        @disconnect-strava="disconnectStrava"
        @connect-garmin="connectGarmin"
        @disconnect-garmin="disconnectGarmin" />

      <ProfileTeamCard
        :team="teamInfo"
        @manage="openTeamManagement"
        @discover="discoverTeams"
        @create-team="createTeam"
        @leave-team="leaveTeam"
      />

      <ProfileStatsGrid :stats="stats" />

      <div class="space-y-6">
        <div id="composer-anchor">
          <ProfilePostComposer :model-value="postComposerForm" :loading="postComposerState.loading"
            :error-message="postComposerState.error" :success-message="postComposerState.success"
            @update:model-value="onPostComposerUpdate" @submit="handlePostSubmit"
            @open-media-library="openMediaLibrary" />
        </div>

        <ProfilePostsCard :posts="posts" @open="openPost" @edit="editPost" @confirm-delete="deletePost"
          @compose="scrollToComposer" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ProfileHero from '../../components/profile/ProfileHero.vue'
import ProfileStatsGrid from '../../components/profile/ProfileStatsGrid.vue'
import ProfilePostComposer from '../../components/profile/ProfilePostComposer.vue'
import ProfilePostsCard from '../../components/profile/ProfilePostsCard.vue'
import ProfileTeamCard from '../../components/profile/ProfileTeamCard.vue'
import { useProfilePage } from './useProfilePage'

const {
  authUser,
  stats,
  posts,
  teamInfo,
  postComposerForm,
  postComposerState,
  settingsForm,
  avatarPreview,
  goToSettings,
  scrollToComposer,
  triggerAvatarUpload,
  openTeamOverview,
  openTeamManagement,
  createTeam,
  discoverTeams,
  leaveTeam,
  openMediaLibrary,
  onPostComposerUpdate,
  handlePostSubmit,
  openPost,
  editPost,
  deletePost,
  stravaIntegration,
  stravaState,
  connectStrava,
  disconnectStrava,
  garminIntegration,
  garminState,
  connectGarmin,
  disconnectGarmin,
} = useProfilePage()
</script>
