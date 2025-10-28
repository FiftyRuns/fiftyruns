import { defineNuxtPlugin } from "nuxt/app"

export default defineNuxtPlugin(async () => {
  try {
    await $fetch('/api/security/csrf')
    if (process.dev) {
      console.info('[CSRF] Token erfolgreich initialisiert.')
    }
  } catch (error) {
    if (process.dev) {
      console.warn('[CSRF] Token konnte nicht geladen werden:', error)
    }
  }
})
