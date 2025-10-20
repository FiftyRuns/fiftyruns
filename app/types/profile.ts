export type Visibility = 'public' | 'protected' | 'private'

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
