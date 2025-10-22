<template>
  <div :class="wrapperClasses">
    <label v-if="label" :for="id" :class="labelClasses">
      <slot name="label">{{ label }}</slot>
    </label>

    <div :class="['relative mt-1', props.inputWrapperClass]">
      <slot name="leading" />
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :aria-invalid="Boolean(error)"
        :aria-describedby="describedByValue"
        :class="inputClasses"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        v-bind="inputAttrs"
      />
      <slot name="trailing" />
    </div>

    <p v-if="hint" :class="hintClasses">
      <slot name="hint">{{ hint }}</slot>
    </p>

    <p v-if="error" :id="errorId" :class="errorClasses">
      <slot name="error">{{ error }}</slot>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

type ClassValue = string | string[] | Record<string, boolean> | undefined

const props = withDefaults(
  defineProps<{
    id?: string
    modelValue: string
    label?: string
    type?: string
    hint?: string
    error?: string
    describedBy?: string
    wrapperClass?: ClassValue
    labelClass?: ClassValue
    inputClass?: ClassValue
    inputWrapperClass?: ClassValue
    hintClass?: ClassValue
    errorClass?: ClassValue
  }>(),
  { type: 'text' }
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'focus', payload: FocusEvent): void
  (event: 'blur', payload: FocusEvent): void
}>()

const attrs = useAttrs()

const inputAttrs = computed(() => {
  const { class: _class, ...rest } = attrs as Record<string, unknown>
  return rest
})

const incomingClass = computed<ClassValue>(() => (attrs as Record<string, unknown>).class as ClassValue)

const errorId = computed(() => (props.error ? `${props.id ?? 'field'}-error` : undefined))
const describedByValue = computed(() => (props.error ? errorId.value : props.describedBy))

const wrapperClasses = computed(() => ['flex flex-col', props.wrapperClass])
const labelClasses = computed(() => ['block text-sm font-medium text-gray-700', props.labelClass])
const inputClasses = computed(() => [
  'w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-black shadow-sm focus:outline-none focus:ring-2 transition',
  props.error ? 'ring-red-400' : '',
  props.inputClass,
  incomingClass.value,
])
const hintClasses = computed(() => ['mt-1 text-xs text-gray-500', props.hintClass])
const errorClasses = computed(() => ['mt-1 text-xs text-red-600', props.errorClass])

const handleInput = (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value)
const handleFocus = (event: FocusEvent) => emit('focus', event)
const handleBlur = (event: FocusEvent) => emit('blur', event)
</script>
