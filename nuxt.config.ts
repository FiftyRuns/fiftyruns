import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-10-09',        
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/scripts'
  ],

  css: ['~/assets/css/main.css'],         

  vite: {
    plugins: [tailwindcss()]              
  }
})
