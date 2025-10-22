<template>
  <div class="px-4 py-20">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <!-- Header -->
      <header class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Profil-Einstellungen</h1>
        <NuxtLink
          to="/profile"
          class="text-sm text-[var(--color-primary)] underline-offset-2 hover:underline"
        >
          ← Zurück zum Profil
        </NuxtLink>
      </header>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
        <!-- Hauptspalte -->
        <div class="space-y-6">
          <!-- Profil & Sichtbarkeit -->
          <ProfileSettingsForm
            :model-value="settingsForm"
            :loading="settingsState.loading"
            :success-message="settingsState.success"
            :error-message="settingsState.error"
            @update:model-value="onSettingsUpdate"          
            @submit="f => handleSettingsSubmit(f as any)"  
          />

          <!-- Passwort ändern -->
          <ProfilePasswordCard
            :model-value="passwordForm"
            :loading="passwordState.loading"
            :error-message="passwordState.error"
            :success-message="passwordState.success"
            @update:model-value="onPasswordUpdate"
            @submit="handlePasswordSubmit"
          />

          <!-- Spenden / Auto-Donate -->
          <ProfileDonationCard
            :model-value="donationSettings"
            :loading="donationState.loading"
            :success-message="donationState.success"
            :error-message="donationState.error"
            @update:model-value="onDonationUpdate"         
            @save="handleDonationSave"
            @open-history="openDonationHistory"
          />

          <!-- Challenges (optional im Settings-Kontext anzeigen) -->
          <ProfileChallengesCard
            :challenges="challenges"
            @create="createChallenge"
          />
        </div>

        <!-- Sidebar -->
        <aside class="space-y-6">
          <!-- Avatar -->
          <ProfileAvatarCard
            v-if="authUser"                                
            :user="authUser"
            :preview="avatarPreview"
            :error="avatarState.error"
            @select-picture="handleAvatarSelect"
            @remove-picture="removeAvatar"
            @error="setAvatarError"
            @saved="handleAvatarSaved"
          />

          <!-- Team-Verwaltung -->
          <ProfileTeamCard
            :team="teamInfo"
            @manage="openTeamManagement"
            @create-team="createTeam"
            @discover="discoverTeams"
            @leave-team="leaveTeam"
          />
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ProfileSettingsForm from '../../components/profile/ProfileSettingsForm.vue'
import ProfilePasswordCard from '../../components/profile/ProfilePasswordCard.vue'
import ProfileDonationCard from '../../components/profile/ProfileDonationCard.vue'
import ProfileChallengesCard from '../../components/profile/ProfileChallengesCard.vue'
import ProfileAvatarCard from '../../components/profile/ProfileAvatarCard.vue'
import ProfileTeamCard from '../../components/profile/ProfileTeamCard.vue'

import { useProfilePage } from './useProfilePage'

const {
  // Daten
  authUser,
  settingsForm,
  settingsState,
  passwordForm,
  passwordState,
  donationSettings,
  donationState,
  challenges,
  teamInfo,
  avatarPreview,
  avatarState,

  // Actions
  onSettingsUpdate,
  onPasswordUpdate,
  onDonationUpdate,
  handleSettingsSubmit,
  handlePasswordSubmit,
  handleDonationSave,
  openDonationHistory,
  handleAvatarSelect,
  removeAvatar,
  setAvatarError,
  handleAvatarSaved,
  openTeamManagement,
  createTeam,
  discoverTeams,
  leaveTeam,
  createChallenge,
} = useProfilePage()
</script>
