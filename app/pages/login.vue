<template>
  <section class="relative min-h-screen px-4 py-16 md:px-8 lg:px-12">
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_90%_10%,rgba(1,73,126,0.06),transparent_60%),radial-gradient(60%_60%_at_15%_85%,rgba(162,201,45,0.08),transparent_65%)]"
    ></div>

    <div class="relative mx-auto grid w-full max-w-7xl items-start gap-10 lg:grid-cols-2">
      <LoginIntro class="w-full lg:pr-8" />
      <LoginForm class="w-full lg:pl-4" />
    </div>
  </section>
</template>

<script setup lang="ts">
import LoginForm from '../components/auth/LoginForm.vue'
import LoginIntro from '../components/auth/LoginIntro.vue'
</script>
