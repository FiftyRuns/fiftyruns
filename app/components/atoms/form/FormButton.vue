<template>
  <component :is="componentTag" :type="buttonType" :disabled="componentDisabled" :class="buttonClasses" v-bind="buttonAttrs">
    <slot>
      {{ isLoading ? loadingLabel : label }}
    </slot>
  </component>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ClassValue = string | string[] | Record<string, boolean> | undefined

const props = withDefaults(
  defineProps<{
    label?: string
    loadingLabel?: string
    variant?: ButtonVariant
    block?: boolean
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    loading?: boolean
    tag?: string
    buttonClass?: ClassValue
  }>(),
  {
    variant: 'primary',
    block: false,
    type: 'button',
    loading: false,
    disabled: false,
    loadingLabel: 'Bitte warten…',
    tag: 'button',
  }
)

const attrs = useAttrs()

const buttonAttrs = computed(() => {
  const { class: _class, type: _type, disabled: _disabled, ...rest } = attrs as Record<string, unknown>
  return rest
})

const incomingClass = computed<ClassValue>(() => (attrs as Record<string, unknown>).class as ClassValue)

const isLoading = computed(() => props.loading)
const isDisabled = computed(() => props.disabled || props.loading)
const componentTag = computed(() => props.tag)
const buttonType = computed(() => (componentTag.value === 'button' ? props.type : undefined))
const componentDisabled = computed(() => (componentTag.value === 'button' ? isDisabled.value : undefined))

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--color-primary)] text-white hover:opacity-95 focus:ring-[var(--color-primary)]/40',
  secondary:
    'bg-white text-[var(--color-primary)] border border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 focus:ring-[var(--color-primary)]/40',
  ghost: 'bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 focus:ring-[var(--color-primary)]/40',
}

const buttonClasses = computed(() => [
  'inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow focus:outline-none focus:ring-2 transition disabled:opacity-60 disabled:cursor-not-allowed',
  props.block ? 'w-full' : '',
  variantClasses[props.variant],
  props.buttonClass,
  incomingClass.value,
])
</script>
