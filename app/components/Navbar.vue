<template>
    <nav :class="[
        'pointer-events-auto fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-10 py-4 transition-all duration-300',
        scrolled ? 'bg-white/80 shadow backdrop-blur-md' : 'bg-white/60 shadow-sm backdrop-blur'
    ]">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center shrink-0" aria-label="Startseite">
            <img src="/images/50runs_Logo.webp" alt="FiftyRuns Logo" class="h-8 sm:h-10 w-auto max-w-[160px]" />
        </NuxtLink>

        <!-- Desktop-Menü -->
        <ul class="hidden md:flex items-center gap-8 text-[color:var(--color-primary)] font-bold text-lg">
            <li>
                <NuxtLink to="/leaderboard" class="hover:text-[color:var(--color-accent)] transition cursor-pointer">
                    Leaderboard</NuxtLink>
            </li>
            <li>
                <NuxtLink to="/beitraege" class="hover:text-[color:var(--color-accent)] transition cursor-pointer">
                    Beiträge</NuxtLink>
            </li>
            <li>
                <NuxtLink to="/anmelden" class="hover:text-[color:var(--color-accent)] transition cursor-pointer">
                    Anmelden</NuxtLink>
            </li>
            <li>
                <NuxtLink to="/registrieren" class="hover:text-[color:var(--color-accent)] transition cursor-pointer">
                    Registrieren</NuxtLink>
            </li>
        </ul>

        <!-- Burger -->
        <button
            class="md:hidden inline-flex items-center justify-center rounded-xl p-2 outline-none ring-0 hover:bg-black/5"
            :aria-expanded="open ? 'true' : 'false'" aria-controls="mobile-menu" @click="toggle()">
            <span class="sr-only">Menü öffnen</span>
            <svg v-if="!open" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    </nav>

    <!-- Mobile Panel -->
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-2">
        <div v-show="open" id="mobile-menu"
            class="md:hidden fixed top-[64px] left-0 right-0 z-40 bg-white/95 backdrop-blur-md shadow border-t border-black/5"
            @click.self="close()">
            <ul
                class="flex flex-col items-center justify-center text-center gap-4 py-6 text-[color:var(--color-primary)] font-medium">
                <li>
                    <NuxtLink @click.native="close()" to="/leaderboard"
                        class="block px-3 py-2 hover:text-[color:var(--color-accent)] transition cursor-pointer">
                        Leaderboard</NuxtLink>
                </li>
                <li>
                    <NuxtLink @click.native="close()" to="/postings"
                        class="block px-3 py-2 hover:text-[color:var(--color-accent)] transition cursor-pointer">
                        Beiträge</NuxtLink>
                </li>
                <li>
                    <NuxtLink @click.native="close()" to="/anmelden"
                        class="block px-3 py-2 hover:text-[color:var(--color-accent)] transition cursor-pointer">
                        Anmelden</NuxtLink>
                </li>
                <li>
                    <NuxtLink @click.native="close()" to="/registrieren"
                        class="block px-3 py-2 hover:text-[color:var(--color-accent)] transition cursor-pointer">
                        Registrieren</NuxtLink>
                </li>
            </ul>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const open = ref(false)
const scrolled = ref(false)

const onScroll = () => { scrolled.value = window.scrollY > 8 }
const onResize = () => { if (window.innerWidth >= 768) open.value = false }
const toggle = () => { open.value = !open.value }
const close = () => { open.value = false }

onMounted(() => {
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
})

onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
})

watch(open, (val) => {
    document.body.style.overflow = val ? 'hidden' : ''
})
</script>
