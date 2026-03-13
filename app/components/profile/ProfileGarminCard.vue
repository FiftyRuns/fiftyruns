<template>
  <ProfilePanel
    title="Garmin verbinden"
    description="Synchronisiere deine Aktivitäten automatisch von deiner Garmin-Uhr und halte dein Laufprofil aktuell."
    :collapsible="props.collapsible"
    :default-open="props.defaultOpen"
  >
    <div class="space-y-4">
      <div
        class="rounded-2xl border border-dashed border-black/10 bg-white/70 p-4 text-sm text-gray-600 shadow-sm"
      >
        <div class="flex items-center gap-2 text-base font-semibold text-black">
          <Icon icon="ph:waveform-duotone" class="h-5 w-5 text-[var(--color-primary)]" />
          <span>{{ integration.connected ? 'Garmin ist verbunden' : 'Noch nicht verbunden' }}</span>
        </div>
        <p v-if="integration.connected" class="mt-2 text-xs text-gray-500">
          Verbunden seit {{ connectedSince }}
          <template v-if="integration.userId"> · User ID: {{ integration.userId }}</template>
        </p>
        <p v-else class="mt-2 text-xs text-gray-500">
          Verbinde dein Garmin-Konto, um Aktivitäten automatisch zu importieren und aktuelle Statistiken zu erhalten.
        </p>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div class="space-y-1 text-xs text-gray-500">
          <p v-if="integration.tokenExpiresAt && integration.connected">
            Token gültig bis {{ tokenExpiresAt }}
          </p>
          <p v-if="state.error" class="font-medium text-red-600">{{ state.error }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <FormButton
            v-if="!integration.connected"
            variant="primary"
            :loading="state.loading"
            label="Mit Garmin verbinden"
            @click="$emit('connect')"
          />

          <FormButton
            v-else
            variant="secondary"
            :loading="state.loading"
            label="Verbindung trennen"
            @click="$emit('disconnect')"
          />
          <FormButton
            v-if="integration.connected"
            variant="ghost"
            label="Erneut verbinden"
            :disabled="state.loading"
            @click="$emit('connect')"
          />
        </div>
      </div>

      <div
        v-if="integration.connected"
        class="rounded-lg border border-black/5 bg-black/2.5 p-3 text-xs text-gray-600"
      >
        <p class="font-medium text-black">Datenquelle</p>
        <p class="mt-1">
          Aktivitäten werden automatisch von Garmin importiert und mit "Datenquelle: Garmin" gekennzeichnet.
        </p>
      </div>
    </div>
  </ProfilePanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import ProfilePanel from './ProfilePanel.vue'
import FormButton from '../atoms/form/FormButton.vue'

type GarminIntegration = {
  connected: boolean
  userId: string | null
  connectedAt: string | null
  tokenExpiresAt: string | null
}

const props = withDefaults(defineProps<{
  integration: GarminIntegration
  state: {
    loading: boolean
    error: string
  }
  collapsible?: boolean
  defaultOpen?: boolean
}>(), {})

defineEmits<{
  (e: 'connect'): void
  (e: 'disconnect'): void
}>()

const connectedSince = computed(() => {
  if (!props.integration.connectedAt) return ''
  try {
    return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(
      new Date(props.integration.connectedAt),
    )
  } catch {
    return props.integration.connectedAt
  }
})

const tokenExpiresAt = computed(() => {
  if (!props.integration.tokenExpiresAt) return ''
  try {
    return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(
      new Date(props.integration.tokenExpiresAt),
    )
  } catch {
    return props.integration.tokenExpiresAt
  }
})
</script>





