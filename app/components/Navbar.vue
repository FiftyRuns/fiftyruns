<template>
    <nav :class="[
        'pointer-events-auto fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-4 sm:px-10 py-4 transition-all duration-300',
        scrolled ? 'bg-white/80 shadow backdrop-blur-md' : 'bg-white/60 shadow-sm backdrop-blur'
    ]">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center shrink-0" aria-label="Startseite">
            <img
                src="/images/50runs_Logo.webp"
                alt="FiftyRuns Logo"
                class="h-8 sm:h-10 w-auto max-w-[160px]"
                fetchpriority="high"
            />
        </NuxtLink>

        <div class="flex items-center gap-4">
            <NotificationBell v-if="isLoggedIn" />

            <!-- Desktop-Menü -->
            <ul class="hidden xl:flex items-center gap-8 text-[color:var(--color-primary)] font-semibold text-base">
            <li v-for="link in navLinks" :key="`desktop-${link.key}`">
                <NuxtLink
                    :to="link.to"
                    class="relative py-1 hover:text-[color:var(--color-accent)] transition-colors cursor-pointer after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-[var(--color-accent)] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200"
                    active-class="text-[color:var(--color-accent)] after:scale-x-100"
                    @click="handleNavLinkClick"
                >
                    {{ link.label }}
                </NuxtLink>
            </li>
            <li v-if="isLoggedIn" ref="profileDropdownRef" class="relative">
                <button
                    type="button"
                    class="flex items-center gap-3 hover:text-[color:var(--color-accent)] transition cursor-pointer"
                    @click="profileOpen = !profileOpen"
                >
                    <span
                        class="relative h-9 w-9 overflow-hidden rounded-full border-2 border-[color:var(--color-primary)]/30 bg-white shadow-sm"
                        aria-hidden="true"
                    >
                        <img
                            v-if="avatarUrl"
                            :src="avatarUrl"
                            :alt="avatarAlt"
                            class="h-full w-full object-cover"
                            width="36"
                            height="36"
                            loading="lazy"
                        />
                        <span
                            v-else
                            class="grid h-full w-full place-items-center text-xs font-semibold uppercase text-[color:var(--color-primary)]"
                        >
                            {{ avatarInitials }}
                        </span>
                    </span>
                    <span>{{ displayName }}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform duration-200" :class="profileOpen ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                <Transition
                    enter-active-class="transition duration-150 ease-out"
                    enter-from-class="opacity-0 -translate-y-1"
                    enter-to-class="opacity-100 translate-y-0"
                    leave-active-class="transition duration-100 ease-in"
                    leave-from-class="opacity-100 translate-y-0"
                    leave-to-class="opacity-0 -translate-y-1"
                >
                    <div v-if="profileOpen" class="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white shadow-lg border border-black/10 py-1 z-50">
                        <NuxtLink
                            to="/profile"
                            class="flex items-center gap-2 px-4 py-2 text-[color:var(--color-primary)] hover:bg-gray-50 hover:text-[color:var(--color-accent)] transition"
                            @click="profileOpen = false"
                        >
                            Profil
                        </NuxtLink>
                        <button
                            type="button"
                            class="flex w-full items-center gap-2 px-4 py-2 text-[color:var(--color-primary)] hover:bg-gray-50 hover:text-[color:var(--color-accent)] transition disabled:opacity-60"
                            :disabled="logoutPending"
                            @click="handleLogout"
                        >
                            Abmelden
                        </button>
                        <p v-if="logoutError" class="px-4 py-1 text-xs text-red-600">{{ logoutError }}</p>
                    </div>
                </Transition>
            </li>
            </ul>

            <!-- Burger -->
            <button
                class="xl:hidden inline-flex items-center justify-center rounded-xl p-2 outline-none ring-0 hover:bg-black/5"
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
        </div>
    </nav>

    <!-- Mobile Panel -->
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-2">
        <div v-show="open" id="mobile-menu"
            class="xl:hidden fixed top-[64px] left-0 right-0 z-40 bg-white/95 backdrop-blur-md shadow border-t border-black/5"
            @click.self="close()">
            <ul
                class="flex flex-col items-center justify-center text-center gap-4 py-6 text-[color:var(--color-primary)] font-medium">
                <li v-for="link in navLinks" :key="`mobile-${link.key}`">
                    <NuxtLink
                        :to="link.to"
                        class="block px-3 py-2 hover:text-[color:var(--color-accent)] transition cursor-pointer"
                        @click="handleNavLinkClick"
                    >
                        {{ link.label }}
                    </NuxtLink>
                </li>
                <li v-if="isLoggedIn" class="w-full">
                    <button
                        type="button"
                        class="flex items-center justify-center gap-3 px-3 py-2 w-full hover:text-[color:var(--color-accent)] transition cursor-pointer"
                        @click="profileMobileOpen = !profileMobileOpen"
                    >
                        <span
                            class="relative h-10 w-10 overflow-hidden rounded-full border-2 border-[color:var(--color-primary)]/30 bg-white shadow-sm"
                            aria-hidden="true"
                        >
                            <img
                                v-if="avatarUrl"
                                :src="avatarUrl"
                                :alt="avatarAlt"
                                class="h-full w-full object-cover"
                                width="40"
                                height="40"
                                loading="lazy"
                            />
                            <span
                                v-else
                                class="grid h-full w-full place-items-center text-sm font-semibold uppercase text-[color:var(--color-primary)]"
                            >
                                {{ avatarInitials }}
                            </span>
                        </span>
                        <span>{{ displayName }}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform duration-200" :class="profileMobileOpen ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <Transition
                        enter-active-class="transition duration-150 ease-out"
                        enter-from-class="opacity-0 -translate-y-1"
                        enter-to-class="opacity-100 translate-y-0"
                        leave-active-class="transition duration-100 ease-in"
                        leave-from-class="opacity-100 translate-y-0"
                        leave-to-class="opacity-0 -translate-y-1"
                    >
                        <div v-if="profileMobileOpen" class="flex flex-col items-center gap-1 mt-1">
                            <NuxtLink
                                to="/profile"
                                class="px-3 py-2 hover:text-[color:var(--color-accent)] transition"
                                @click="close()"
                            >
                                Profil
                            </NuxtLink>
                            <button
                                type="button"
                                class="px-3 py-2 hover:text-[color:var(--color-accent)] transition disabled:opacity-60"
                                :disabled="logoutPending"
                                @click="handleLogout"
                            >
                                Abmelden
                            </button>
                            <p v-if="logoutError" class="text-xs text-red-600">{{ logoutError }}</p>
                        </div>
                    </Transition>
                </li>
            </ul>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useAuthUser } from '../composables/useAuthUser'
import { useAuthTeam, refreshAuthTeam, setAuthTeam } from '../composables/useAuthTeam'
import { useLogout } from '../composables/useLogout'
import NotificationBell from './notifications/NotificationBell.vue'

type NavLink = {
  key: string
  label: string
  to: string
}

const open = ref(false)
const scrolled = ref(false)
const profileOpen = ref(false)
const profileMobileOpen = ref(false)
const profileDropdownRef = ref<HTMLElement | null>(null)
const authUser = useAuthUser()
const authTeam = useAuthTeam()
const isLoggedIn = computed(() => Boolean(authUser.value))
const displayName = computed(() => authUser.value?.name ?? 'Profil')
const avatarUrl = computed(() => authUser.value?.image ?? null)
const avatarInitials = computed(() => {
    const name = authUser.value?.name ?? ''
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || 'P'
})
const avatarAlt = computed(() =>
    authUser.value?.name ? `Profilbild von ${authUser.value.name}` : 'Profilbild'
)
const teamLinkTarget = computed(() => '/team/discover')
const teamLinkLabel = computed(() => 'Teams')
const staticNavLinks: NavLink[] = [
    { key: 'leaderboard', label: 'Leaderboard', to: '/leaderboard' },
    { key: 'challenges', label: 'Challenges', to: '/challenges' },
    { key: 'postings', label: 'Beiträge', to: '/postings' },
]
const navLinks = computed<NavLink[]>(() => {
    const items: NavLink[] = [...staticNavLinks]
    if (isLoggedIn.value) {
        items.push({
            key: 'team',
            label: teamLinkLabel.value,
            to: teamLinkTarget.value,
        })
    } else {
        items.push(
            { key: 'login', label: 'Anmelden', to: '/login' },
            { key: 'register', label: 'Registrieren', to: '/register' },
        )
    }
    return items
})
const { logout, pending: logoutPending, error: logoutError } = useLogout()

watch(
    authUser,
    (user, previous) => {
        if (user) {
            if (!previous || user.id !== previous.id || !authTeam.value) {
                refreshAuthTeam()
            }
        } else {
            setAuthTeam(null)
        }
    },
    { immediate: true },
)

const onScroll = () => { scrolled.value = window.scrollY > 8 }
const onResize = () => { if (window.innerWidth >= 1280) open.value = false }
const toggle = () => { open.value = !open.value }
const close = () => { open.value = false; profileMobileOpen.value = false }
const onClickOutside = (e: MouseEvent) => {
    if (profileDropdownRef.value && !profileDropdownRef.value.contains(e.target as Node)) {
        profileOpen.value = false
    }
}
const handleNavLinkClick = () => {
    if (open.value) {
        close()
    }
}
const resetBodyScroll = () => {
    document.body.style.overflow = ''
}

const handleLogout = async () => {
    const success = await logout({ redirectTo: '/login?loggedOut=1' })
    if (success) {
        close()
    }
}

onMounted(() => {
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    document.addEventListener('click', onClickOutside)
})

onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
    document.removeEventListener('click', onClickOutside)
    resetBodyScroll()
})

watch(open, (val) => {
    document.body.style.overflow = val ? 'hidden' : ''
})
</script>
