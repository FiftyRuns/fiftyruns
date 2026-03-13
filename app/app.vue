<script setup lang="ts">
import Navbar from './components/Navbar.vue'
import ToastContainer from './components/molecules/ToastContainer.vue'
</script>

<template>
  <Navbar />
  <NuxtPage />
  <ToastContainer />
  <footer class="border-t border-gray-200 bg-white py-8 mt-16">
    <div class="container mx-auto px-6 flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
      <div class="flex gap-6 text-sm text-[var(--color-primary)]/70">
        <NuxtLink to="/impressum" class="hover:text-[var(--color-primary)] transition-colors">Impressum</NuxtLink>
        <NuxtLink to="/datenschutz" class="hover:text-[var(--color-primary)] transition-colors">Datenschutz</NuxtLink>
      </div>
      <a href="https://cyberhouse.at" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
        <span class="text-xs text-gray-500">powered by</span>
        <img src="https://50runs.com/image/Cyberhouse_Logo_rgb_200.svg" alt="Cyberhouse" class="h-6 w-auto" />
      </a>
    </div>
  </footer>
</template>
