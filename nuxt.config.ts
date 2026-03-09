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
    server: {
      allowedHosts: ["bidding-shorter-crowd-bumper.trycloudflare.com"],
    },
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
    '/api/**': {
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': process.env.PUBLIC_ORIGIN || 'https://50runs.app',
        'Access-Control-Allow-Credentials': 'true',
      }
    }
  },

  runtimeConfig: {
    sessionSecret: process.env.SESSION_SECRET,
    databaseUrl: process.env.DATABASE_URL,
    stravaClientId: process.env.STRAVA_CLIENT_ID,
    stravaClientSecret: process.env.STRAVA_CLIENT_SECRET,
    stravaRedirectUri: process.env.STRAVA_REDIRECT_URI,
    stravaDefaultScope: process.env.STRAVA_DEFAULT_SCOPE,
    stravaWebhookVerifyToken: process.env.STRAVA_WEBHOOK_VERIFY_TOKEN,
    stravaWebhookCallbackUrl: process.env.STRAVA_WEBHOOK_CALLBACK_URL
  },

  nitro: {
    preset: process.env.NODE_ENV === 'production' ? 'vercel' : 'node',
    externals: {
      inline: [],
      external: ['argon2'],
    },
  },

  app: {
    head: {
      title: "50runs",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: "50runs" }
      ],
      link: [{ rel: "icon", href: "/favicon.ico" }],
      style: [
        {
          children: `
            :root { --color-primary: #01497e; --color-accent: #a2c92d; }
            html, body { background-color: white; color: #01497e; font-family: system-ui, sans-serif; margin: 0; }
            body { padding-top: 72px; }
          `
        }
      ]
    }
  }
});
