<template>
  <div :class="wrapperClasses">
    <label :for="id" class="flex items-start gap-2">
      <input
        :id="id"
        type="checkbox"
        :checked="modelValue"
        :aria-invalid="Boolean(error)"
        :aria-describedby="errorId"
        :class="inputClasses"
        @change="handleChange"
        v-bind="inputAttrs"
      />
      <span :class="labelClasses">
        <slot>{{ label }}</slot>
      </span>
    </label>

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

const props = defineProps<{
  id?: string
  modelValue: boolean
  label?: string
  hint?: string
  error?: string
  wrapperClass?: ClassValue
  inputClass?: ClassValue
  labelClass?: ClassValue
  hintClass?: ClassValue
  errorClass?: ClassValue
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const attrs = useAttrs()

const inputAttrs = computed(() => {
  const { class: _class, ...rest } = attrs as Record<string, unknown>
  return rest
})

const incomingClass = computed<ClassValue>(() => (attrs as Record<string, unknown>).class as ClassValue)

const errorId = computed(() => (props.error ? `${props.id ?? 'checkbox'}-error` : undefined))
const wrapperClasses = computed(() => ['flex flex-col', props.wrapperClass])
const inputClasses = computed(() => [
  'mt-1 size-4 rounded border-gray-300 focus:outline-none focus:ring-2 transition',
  incomingClass.value,
  props.inputClass,
])
const labelClasses = computed(() => ['text-sm text-gray-700', props.labelClass])
const hintClasses = computed(() => ['mt-1 text-xs text-gray-500', props.hintClass])
const errorClasses = computed(() => ['mt-1 text-xs text-red-600', props.errorClass])

const handleChange = (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).checked)
</script>
