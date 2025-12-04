export type Visibility = 'public' | 'protected' | 'private'
export type DonationMultiplier = 'x1' | 'x2' | 'x5' | 'x10'

export interface ProfileSettings {
  name: string
  email: string
  bio: string
  visibility: Visibility
  notifications: boolean
  updatedAt: string
}

export interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface DonationSettings {
  amount: number
  autoDonate: boolean
  updatedAt: string
}

export interface ProfileMeResponse {
  user: {
    id: string
    name: string
    nameId: string
    email: string
    image: string | null
  }
  stats: {
    totalDistanceMeters: number
    totalDurationSeconds: number
    totalRuns: number
  }
  posts: Array<{
    id: string
    text: string
    createdAt: string
    visibility: Visibility
    reactions: number
    comments: number
  }>
  challenges: Array<{
    id: string
    name: string
    description: string | null
    startAt: string
    endAt: string
    goalType: 'DISTANCE' | 'TIME' | 'RUNS'
    goalDistanceMeters: number | null
    goalDurationSeconds: number | null
    goalRuns: number | null
    participants: number
  }>
  team: {
    id: string
    name: string
    members: number
  } | null
  donation: {
    amount: number
    multiplier: DonationMultiplier | null
    autoDonate: boolean
    updatedAt: string | null
  }
  integrations: {
    strava: {
      connected: boolean
      athleteId: string | null
      scopes: string[]
      connectedAt: string | null
      tokenExpiresAt: string | null
      deauthorizedAt: string | null
    }
    garmin?: {
      connected: boolean
      userId: string | null
      connectedAt: string | null
      tokenExpiresAt: string | null
    }
  }
  settings: {
    bio: string | null
    visibility: Visibility
    notifications: boolean
    updatedAt: string | null
  }
}
