<template>
    <component :is="tag" :class="sectionClasses">
        <div class="container mx-auto">
            <div :class="wrapperClasses">
                <!-- Eyebrow -->
                <p v-if="eyebrow" class="mb-3 text-sm font-semibold tracking-wider text-[var(--color-accent)]">
                    {{ eyebrow }}
                </p>

                <!-- Titel -->
                <h2 v-if="title" :class="titleClasses">
                    {{ title }}
                </h2>

                <!-- Lead / Untertitel -->
                <p v-if="lead" :class="leadClasses">
                    {{ lead }}
                </p>

                <!-- Inhalt -->
                <div :class="contentClasses">
                    <slot />
                </div>

                <!-- Optionaler Actions-Slot -->
                <div v-if="$slots.actions" :class="actionsClasses">
                    <slot name="actions" />
                </div>
            </div>
        </div>
    </component>
</template>

<script lang="ts" setup>
/**
 * TextBlock – leichter, wiederverwendbarer Text-Abschnitt für die Landing Page.
 * Fokus: Reiner Text (Titel, Lead, Fließtext) – ohne Bilder/Media.
 * Farben: Primär (Schrift) var(--color-primary), Sekundär (Akzent/Trennlinie) var(--color-accent)
 */

import { computed } from 'vue'

const props = defineProps({
    title: { type: String, default: '' },
    eyebrow: { type: String, default: '' },
    lead: { type: String, default: '' },
    align: { type: String as () => 'left' | 'center', default: 'left' },
    width: { type: String as () => 'narrow' | 'wide', default: 'narrow' },
    spacing: { type: String as () => 'sm' | 'md' | 'lg', default: 'md' },
    tone: { type: String as () => 'default' | 'muted', default: 'default' },
    tag: { type: String, default: 'section' },
})

const sectionClasses = computed(() => {
    const space = props.spacing === 'sm' ? 'py-10' : props.spacing === 'lg' ? 'py-24' : 'py-16'
    return [space].join(' ')
})

const wrapperClasses = computed(() => {
  const w = props.width === 'wide' ? 'max-w-4xl' : 'max-w-2xl'
  const a = props.align === 'center' ? 'text-center mx-auto' : ''
  return [w, a, 'px-4 sm:px-0'].join(' ')
})

const baseText = computed(() => (props.tone === 'muted' ? 'text-[rgb(var(--color-primary-rgb)/0.8)]' : 'text-[var(--color-primary)]'))
const secondaryText = computed(() => (props.tone === 'muted' ? 'text-[rgb(var(--color-accent-rgb)/0.8)]' : 'text-[var(--color-accent)]'))

const titleClasses = computed(() => [
    'text-3xl sm:text-4xl font-extrabold tracking-tight',
    baseText.value
].join(' '))

const leadClasses = computed(() => [
    'mt-4 text-lg sm:text-xl font-medium',
    secondaryText.value
].join(' '))

const contentClasses = computed(() => [
    'mt-6 space-y-4 leading-relaxed',
    baseText.value,
    '[&>p]:text-base [&>p]:sm:text-lg',
    '[&>ul]:list-disc [&>ul]:pl-6 [&>ul>li]:marker:text-[var(--color-accent)]',
    '[&>ol]:list-decimal [&>ol]:pl-6',
    '[&>hr]:my-6 [&>hr]:h-0 [&>hr]:border-0 [&>hr]:border-t [&>hr]:border-[var(--divider-color)]'
].join(' '))
const actionsClasses = computed(() => [
    'mt-8 flex flex-wrap items-center gap-3',
    props.align === 'center' ? 'justify-center' : ''
].join(' '))

</script>

<!--
USAGE-BEISPIELE

1) Schmal, linksbündig (Standard)

  <TextBlock
    eyebrow="WARUM #50runs?"
    title="Gemeinsam fit werden"
    lead="Mit klaren Zielen, starker Community und viel Motivation."
  >
    <p>
      #50runs ist die Lauf-Challenge, die Training mit Impact verbindet. Du sammelst
      Läufe, verbesserst deine Fitness und unterstützt dabei soziale Projekte.
    </p>
    <p>
      Melde dich an, setze dir ein persönliches Ziel und bleib durch kleine,
      realistische Schritte am Ball.
    </p>
    <ul>
      <li>Einfach starten – ohne Druck</li>
      <li>Motivation durch Teamspirit</li>
      <li>Transparenter Fortschritt</li>
    </ul>
    <hr />
    <p>
      Ab <strong>15. Mai 2026</strong> geht’s wieder los!
    </p>
  </TextBlock>

2) Breit & zentriert

  <TextBlock
    width="wide"
    align="center"
    eyebrow="DIE IDEE"
    title="Mit jeder Einheit etwas Gutes tun"
    lead="Deine Aktivität schafft Mehrwert – für dich und andere."
  >
    <p>
      Jede registrierte Laufeinheit trägt zu einer Spende unserer Partner bei.
      So wird dein Training zu einem Beitrag für soziale Projekte.
    </p>
  </TextBlock>

3) Mit Actions-Slot (z. B. Link/CTA)

  <TextBlock
    title="Bereit für die Challenge?"
    align="center"
  >
    <p>Starte jetzt – die Anmeldung dauert nur 2 Minuten.</p>
    <template #actions>
      <NuxtLink
        to="/register"
        class="inline-flex items-center rounded-2xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--color-primary)] shadow transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-accent)] focus-visible:ring-opacity-50"
      >
        Jetzt registrieren
      </NuxtLink>
    </template>
  </TextBlock>
-->
