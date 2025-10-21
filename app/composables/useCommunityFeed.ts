import { ref } from 'vue'
import { useCookie } from 'nuxt/app'
import { REACTION_EMOJIS, type ReactionEmoji } from '@/constants/reactions'

type Author = {
  id: string
  name: string
  nameId: string
  image: string | null
}

type ReactionStat = {
  emoji: ReactionEmoji
  count: number
}

type Comment = {
  id: string
  text: string
  createdAt: string
  author: Author
}

export type CommunityPost = {
  id: string
  createdAt: string
  text: string
  image: string | null
  visibility: 'public' | 'protected'
  author: Author
  runningExercise: {
    distanceInMeters: number | null
    durationInSeconds: number | null
  }
  reactions: ReactionStat[]
  viewerReaction: ReactionEmoji | null
  comments: Comment[]
}

const postsState = ref<CommunityPost[]>([])
const loadingState = ref(false)
const errorState = ref('')

export function useCommunityFeed() {
  const csrfCookie = useCookie<string | null>('csrf_token', { default: () => null })

  async function loadFeed() {
    loadingState.value = true
    errorState.value = ''
    try {
      const data = await $fetch<{
        items: CommunityPost[]
        nextCursor: string | null
      }>('/api/postings', { credentials: 'include' })

      postsState.value = data.items.map((item) => ({
        ...item,
        reactions: REACTION_EMOJIS.map((emoji) => {
          const found = item.reactions.find((entry) => entry.emoji === emoji)
          return { emoji, count: found?.count ?? 0 }
        }),
        viewerReaction: item.viewerReaction,
      }))
    } catch (error) {
      console.error('Feed laden fehlgeschlagen', error)
      errorState.value = 'Beiträge konnten nicht geladen werden.'
    } finally {
      loadingState.value = false
    }
  }

  async function toggleReaction(postId: string, emoji: ReactionEmoji) {
    const csrf = csrfCookie.value ?? ''
    try {
      const response = await $fetch<{
        reactions: ReactionStat[]
        viewerReaction: ReactionEmoji | null
      }>(`/api/postings/${postId}/reactions`, {
        method: 'POST',
        body: { emoji },
        headers: { 'x-csrf-token': csrf },
        credentials: 'include',
      })

      const post = postsState.value.find((entry) => entry.id === postId)
      if (!post) return
      post.reactions = REACTION_EMOJIS.map((value) => {
        const item = response.reactions.find((reaction) => reaction.emoji === value)
        return { emoji: value, count: item?.count ?? 0 }
      })
      post.viewerReaction = response.viewerReaction
    } catch (error) {
      console.error('Reaktion fehlgeschlagen', error)
    }
  }

  async function removeReaction(postId: string) {
    const csrf = csrfCookie.value ?? ''
    try {
      const response = await $fetch<{
        reactions: ReactionStat[]
        viewerReaction: ReactionEmoji | null
      }>(`/api/postings/${postId}/reactions`, {
        method: 'POST',
        body: { emoji: null },
        headers: { 'x-csrf-token': csrf },
        credentials: 'include',
      })

      const post = postsState.value.find((entry) => entry.id === postId)
      if (!post) return
      post.reactions = REACTION_EMOJIS.map((value) => {
        const item = response.reactions.find((reaction) => reaction.emoji === value)
        return { emoji: value, count: item?.count ?? 0 }
      })
      post.viewerReaction = response.viewerReaction
    } catch (error) {
      console.error('Reaktion entfernen fehlgeschlagen', error)
    }
  }

  async function addComment(postId: string, text: string) {
    const csrf = csrfCookie.value ?? ''
    const trimmed = text.trim()
    if (!trimmed) return

    try {
      const response = await $fetch<Comment>(`/api/postings/${postId}/comments`, {
        method: 'POST',
        body: { text: trimmed },
        headers: { 'x-csrf-token': csrf },
        credentials: 'include',
      })

      const post = postsState.value.find((entry) => entry.id === postId)
      if (!post) return
      post.comments.push(response)
    } catch (error) {
      console.error('Kommentar konnte nicht gespeichert werden', error)
    }
  }

  return {
    posts: postsState,
    loading: loadingState,
    error: errorState,
    reactionEmojis: REACTION_EMOJIS,
    loadFeed,
    toggleReaction,
    removeReaction,
    addComment,
  }
}
