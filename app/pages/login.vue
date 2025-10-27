<template>
  <section class="relative min-h-screen px-4 py-8 md:py-16 md:px-8 lg:px-12">
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_90%_10%,rgba(1,73,126,0.06),transparent_60%),radial-gradient(60%_60%_at_15%_85%,rgba(162,201,45,0.08),transparent_65%)]">
    </div>

    <div class="relative mx-auto grid w-full max-w-7xl items-start gap-10 lg:grid-cols-2">
      <header class="space-y-3 md:hidden">
        <Textblock width="wide" align="left" eyebrow="WILLKOMMEN ZURÜCK" title="Melde dich bei 50runs an"
          lead="Bleib bei deinen Challenges und dem Team auf dem Laufenden.">
          <p class="text-gray-700 text-balance">
            Logge dich ein, um deine Läufe zu tracken, Statistiken zu vergleichen und gemeinsam mit der Community aktiv
            zu bleiben.
          </p>
        </Textblock>
      </header>
      <LoginForm class="w-full lg:order-2 lg:pl-4" />
      <LoginIntro class="hidden w-full md:block lg:order-1 lg:pr-8" />
    </div>
  </section>
</template>

<script setup lang="ts">
import LoginForm from '../components/auth/LoginForm.vue'
import LoginIntro from '../components/auth/LoginIntro.vue'
import Textblock from '../components/Textblock.vue'
</script>
