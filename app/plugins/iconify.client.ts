import { addCollection } from '@iconify/vue'
import { icons as phIcons } from '@iconify-json/ph'
import { icons as lucideIcons } from '@iconify-json/lucide'

export default defineNuxtPlugin(() => {
  addCollection(phIcons)
  addCollection(lucideIcons)
})
