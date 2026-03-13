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

      <div class="flex flex-col gap-6">
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

        <!-- Profilbild -->
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
    </div>
  </div>
</template>

<script setup lang="ts">
import ProfileSettingsForm from '../../components/profile/ProfileSettingsForm.vue'
import ProfilePasswordCard from '../../components/profile/ProfilePasswordCard.vue'
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
  avatarPreview,
  avatarState,
  stravaIntegration,
  stravaState,
  garminIntegration,
  garminState,

  // Actions
  onSettingsUpdate,
  onPasswordUpdate,
  handleSettingsSubmit,
  handlePasswordSubmit,
  handleAvatarSelect,
  removeAvatar,
  setAvatarError,
  handleAvatarSaved,
  connectStrava,
  disconnectStrava,
  connectGarmin,
  disconnectGarmin,
} = useProfilePage()
</script>
