import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-10-10", 
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  modules: [
    "@nuxt/image",
    "@nuxt/content"
  ],

  runtimeConfig: {
    sessionSecret: process.env.SESSION_SECRET,
    databaseUrl: process.env.DATABASE_URL
  },

  nitro: { preset: "vercel" },

  app: {
    head: {
      title: "Fifty Runs",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: "Fifty Runs – Running & Giving" }
      ],
      link: [{ rel: "icon", href: "/favicon.ico" }]
    }
  }
});
