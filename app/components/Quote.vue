<template #QuoteCardInner="{ author, role, authorImage, compact, $slots }">
    <div :class="[constrain ? 'mx-auto' : '', maxWidthClass, 'mb-8 sm:mb-6']">
        <figure :class="[
            'relative rounded-3xl border border-[#a2c92d] bg-white/70 backdrop-blur-sm shadow-sm text-[#01497e]',
            compact ? 'p-5 sm:p-6 pb-16 sm:pb-20' : 'p-6 sm:p-8 pb-20 sm:pb-24'
        ]">
            <!-- Zitat-Icon links oben -->
            <div class="absolute -top-4 left-6 h-8 w-8 rounded-md bg-[#a2c92d] text-white grid place-items-center">
                <span class="text-xl leading-none">"</span>
            </div>

            <!-- Eyebrow Text -->
            <p v-if="eyebrow" class="text-xs uppercase font-semibold tracking-wider text-[#a2c92d] mb-1">{{ eyebrow }}
            </p>

            <!-- Title -->
            <h3 v-if="title" :class="compact ? 'text-lg font-bold mb-1' : 'text-2xl font-extrabold mb-2'">{{ title }}
            </h3>

            <!-- Lead Text -->
            <p v-if="leadText" :class="compact ? 'text-sm text-[#01497e]/80 mb-4' : 'text-base text-[#01497e]/90 mb-6'">
                {{ leadText }}</p>

            <!-- Zitattext -->
            <blockquote
                :class="['font-medium leading-relaxed', compact ? 'text-[15px] sm:text-base md:text-lg' : 'text-base sm:text-lg md:text-xl']">
                <slot />
            </blockquote>

            <!-- Autorinfos -->
            <figcaption class="mt-8 sm:mt-10 text-center sm:text-left">
                <p class="font-extrabold text-[#a2c92d] text-lg leading-tight">{{ author }}</p>
                <p v-if="role" class="text-sm text-black/80">{{ role }}</p>
            </figcaption>

            <!-- Profilbild -->
            <div v-if="authorImage" class="absolute left-1/2 sm:left-6 -bottom-10 -translate-x-1/2 sm:translate-x-0">
                <img :src="authorImage" :alt="author" :class="[
                    'rounded-full border-2 border-[#a2c92d] object-cover bg-white',
                    compact ? 'h-16 w-16 sm:h-20 sm:w-20' : 'h-20 w-20 sm:h-24 sm:w-24'
                ]" loading="lazy" />
            </div>

            <!-- Social Instagram -->
            <div v-if="instagram" class="absolute bottom-4 right-5 sm:bottom-6 sm:right-8 flex items-center gap-3">
                <NuxtLink :to="instagram" target="_blank" rel="noopener noreferrer"
                    class="group flex items-center gap-2 text-[#01497e] hover:text-[#a2c92d] transition-colors">
                    <Icon icon="lucide:instagram"
                        class="h-6 w-6 sm:h-7 sm:w-7 group-hover:scale-110 transition-transform" />
                    <span class="text-sm hidden sm:inline font-semibold">Instagram</span>
                </NuxtLink>
            </div>
        </figure>
    </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, defineProps } from 'vue'

const props = defineProps({
    author: { type: String, required: true },
    role: { type: String, default: '' },
    authorImage: { type: String, default: '' },
    instagram: { type: String, default: 'https://www.instagram.com/50runs/' },
    eyebrow: { type: String, default: '' },
    title: { type: String, default: '' },
    leadText: { type: String, default: '' },
    maxWidth: { type: String as () => 'sm' | 'md' | 'lg' | 'xl' | '2xl', default: 'xl' },
    compact: { type: Boolean, default: false },
    constrain: { type: Boolean, default: true }
})

const map: Record<string, string> = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
    '2xl': 'max-w-3xl'
}
const maxWidthClass = computed(() => map[props.maxWidth] ?? 'max-w-2xl')
</script>
