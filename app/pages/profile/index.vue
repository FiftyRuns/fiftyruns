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

      <ProfileStatsGrid :stats="stats" />

      <div id="composer-anchor">
        <ProfilePostComposer :model-value="postComposerForm" :loading="postComposerState.loading"
          :error-message="postComposerState.error" :success-message="postComposerState.success"
          @update:model-value="onPostComposerUpdate" @submit="handlePostSubmit"
          @open-media-library="openMediaLibrary" />
      </div>

      <div class="grid gap-8 lg:grid-cols-2">
        <ProfileTeamCard
          :team="teamInfo"
          @manage="openTeamManagement"
          @discover="discoverTeams"
          @create-team="createTeam"
          @leave-team="leaveTeam"
        />

        <ProfileChallengesCard
          :challenges="challenges"
          @create="createChallenge"
        />
      </div>

      <ProfileDonationCard
        :model-value="donationSettings"
        :total-donation-cent="totalDonationCent"
        :loading="donationState.loading"
        :success-message="donationState.success"
        :error-message="donationState.error"
        @update:model-value="onDonationUpdate"
        @save="handleDonationSave"
        @open-history="openDonationHistory"
      />

      <ProfilePostsCard :posts="posts" @open="openPost" @edit="editPost" @confirm-delete="deletePost"
        @compose="scrollToComposer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import ProfileHero from '../../components/profile/ProfileHero.vue'
import ProfileStatsGrid from '../../components/profile/ProfileStatsGrid.vue'
import ProfilePostComposer from '../../components/profile/ProfilePostComposer.vue'
import ProfilePostsCard from '../../components/profile/ProfilePostsCard.vue'
import ProfileTeamCard from '../../components/profile/ProfileTeamCard.vue'
import ProfileDonationCard from '../../components/profile/ProfileDonationCard.vue'
import ProfileChallengesCard from '../../components/profile/ProfileChallengesCard.vue'
import { useProfilePage } from './useProfilePage'

const {
  authUser,
  stats,
  totalDonationCent,
  posts,
  teamInfo,
  postComposerForm,
  postComposerState,
  settingsForm,
  avatarPreview,
  donationSettings,
  donationState,
  onDonationUpdate,
  handleDonationSave,
  openDonationHistory,
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
  challenges,
  createChallenge,
} = useProfilePage()
</script>
