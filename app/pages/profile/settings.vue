<template>
  <div class="px-4 py-20">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <!-- Header -->
      <header class="flex items-center justify-between">
        <h1 class="text-2xl  font-semibold text-black">Profil-Einstellungen</h1>
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
            collapsible
            :default-open="false"
            :model-value="settingsForm"
            :loading="settingsState.loading"
            :success-message="settingsState.success"
            :error-message="settingsState.error"
            @update:model-value="onSettingsUpdate"
            @submit="f => handleSettingsSubmit(f as any)"
          />

          <!-- Passwort ändern -->
          <ProfilePasswordCard
            collapsible
            :default-open="false"
            :model-value="passwordForm"
            :loading="passwordState.loading"
            :error-message="passwordState.error"
            :success-message="passwordState.success"
            @update:model-value="onPasswordUpdate"
            @submit="handlePasswordSubmit"
          />

          <!-- Spenden / Auto-Donate -->
          <ProfileDonationCard
            collapsible
            :default-open="false"
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
            collapsible
            :default-open="false"
            :challenges="challenges"
            @create="createChallenge"
          />

          <!-- Integrationen -->
          <div class="grid gap-6 sm:grid-cols-2">
            <ProfileStravaCard
              collapsible
              :default-open="false"
              :integration="stravaIntegration"
              :state="stravaState"
              @connect="connectStrava"
              @disconnect="disconnectStrava"
            />
            <ProfileGarminCard
              collapsible
              :default-open="false"
              :integration="garminIntegration"
              :state="garminState"
              @connect="connectGarmin"
              @disconnect="disconnectGarmin"
            />
          </div>
        </div>

        <!-- Sidebar -->
        <aside class="space-y-6">
          <!-- Avatar -->
          <ProfileAvatarCard
            v-if="authUser"
            collapsible
            :default-open="false"
            :user="authUser"
            :preview="avatarPreview"
            :error="avatarState.error"
            @select-picture="handleAvatarSelect"
            @remove-picture="removeAvatar"
            @error="setAvatarError"
            @saved="handleAvatarSaved"
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
import ProfileStravaCard from '../../components/profile/ProfileStravaCard.vue'
import ProfileGarminCard from '../../components/profile/ProfileGarminCard.vue'
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
  avatarPreview,
  avatarState,
  stravaIntegration,
  stravaState,
  garminIntegration,
  garminState,

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
  connectStrava,
  disconnectStrava,
  connectGarmin,
  disconnectGarmin,
  createChallenge,
} = useProfilePage()
</script>
