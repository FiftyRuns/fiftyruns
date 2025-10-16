import { defineNuxtPlugin } from "nuxt/app"

export default defineNuxtPlugin(async () => {
  try {
    await $fetch('/api/security/csrf')
    console.info('[CSRF] Token erfolgreich initialisiert.')
  } catch (error) {
    console.warn('[CSRF] Token konnte nicht geladen werden:', error)
  }
})
