<template>
  <ProfilePanel title="Spenden & Unterstützung" description="Bestimme deinen Beitrag pro Lauf oder Challenge.">
    <div class="space-y-6">
      <div class="grid gap-4 sm:grid-cols-2">
        <label
          v-for="option in donationOptions"
          :key="option.value"
          class="relative flex cursor-pointer flex-col gap-2 rounded-2xl border border-black/5 bg-white/70 p-4 shadow-sm transition hover:shadow-md"
        >
          <input
            class="sr-only"
            type="radio"
            name="donation"
            :value="option.value"
            :checked="modelValue.amount === option.value"
            @change="$emit('update:modelValue', { ...modelValue, amount: option.value })"
          />
          <span
            class="pointer-events-none absolute inset-0 rounded-2xl border-2 border-transparent transition"
            :class="modelValue.amount === option.value ? 'border-[var(--color-primary)]/60 shadow-lg shadow-[var(--color-primary)]/20' : ''"
          ></span>
          <div class="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Icon :icon="option.icon" class="h-5 w-5 text-[var(--color-primary)]" />
            {{ option.label }}
          </div>
          <p class="text-xs text-gray-500">{{ option.description }}</p>
        </label>
      </div>

      <div class="rounded-2xl border border-dashed border-black/10 bg-white/70 p-4 text-sm text-gray-600">
        <div class="flex items-center gap-2 text-[var(--color-primary)]">
          <Icon icon="ph:hand-heart-duotone" class="h-5 w-5" />
          <span>Automatische Spende aktivieren</span>
        </div>
        <label class="mt-3 flex items-start gap-3 text-xs text-gray-600">
          <input
            class="mt-1 h-4 w-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]/40"
            type="checkbox"
            :checked="modelValue.autoDonate"
            @change="$emit('update:modelValue', { ...modelValue, autoDonate: ($event.target as HTMLInputElement).checked })"
          />
          <span>Ich möchte nach jeder Challenge automatisch den oben gewählten Betrag spenden.</span>
        </label>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-xs text-gray-500">Aktualisiert: {{ lastUpdated }}</p>
        <div class="flex items-center gap-2">
          <FormButton variant="secondary" label="Historie" @click="$emit('view-history')" />
          <FormButton variant="primary" :loading="loading" label="Plan speichern" @click="$emit('save')" />
        </div>
      </div>
    </div>
  </ProfilePanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import ProfilePanel from '~/components/profile/ProfilePanel.vue'
import FormButton from '~/components/atoms/form/FormButton.vue'

type DonationSettings = {
  amount: number
  autoDonate: boolean
  updatedAt?: string | Date
}

const props = withDefaults(
  defineProps<{
    modelValue: DonationSettings
    loading?: boolean
  }>(),
  {
    loading: false,
  },
)

defineEmits<{
  (e: 'update:modelValue', value: DonationSettings): void
  (e: 'save'): void
  (e: 'view-history'): void
}>()

const donationOptions = [
  { value: 1, label: '1 € pro Lauf', description: 'Perfekt für den Einstieg.', icon: 'ph:coin-duotone' },
  { value: 2, label: '2 € Momentum', description: 'Step-by-step den Impact erhöhen.', icon: 'ph:arrow-up-right-duotone' },
  { value: 5, label: '5 € motivierend', description: 'Spürbarer Beitrag pro Session.', icon: 'ph:rocket-launch-duotone' },
  { value: 10, label: '10 € Fokus', description: 'Für ambitionierte Spendenziele.', icon: 'ph:trophy-duotone' },
]

const lastUpdated = computed(() => {
  const date = props.modelValue.updatedAt ? new Date(props.modelValue.updatedAt) : new Date()
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
})
</script>
