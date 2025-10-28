import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-10-10", 
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],

  experimental: {
    payloadExtraction: true,
    viewTransition: true
  },

  vite: {
    plugins: [
      tailwindcss(),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router'],
            'iconify': ['@iconify/vue'],
            'utils': ['@vueuse/core']
          }
        }
      }
    }
  },

  modules: [
    "@nuxt/image",
  ],

  routeRules: {
    '/': { prerender: true },
    '/postings': { swr: 60 },
    '/challenges': { swr: 60 },
    '/api/**': { cors: true }
  },

  runtimeConfig: {
    sessionSecret: process.env.SESSION_SECRET,
    databaseUrl: process.env.DATABASE_URL
  },

  nitro: { preset: "vercel" },

  app: {
    head: {
      title: "50runs",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: "50runs" }
      ],
      link: [{ rel: "icon", href: "/favicon.ico" }]
    }
  }
});
