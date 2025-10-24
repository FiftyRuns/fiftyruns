export type TeamRole = 'ADMIN' | 'MEMBER' | null

export interface TeamMember {
  id: string
  name: string
  nameId: string
  email?: string | null
  image?: string | null
  role: TeamRole
  roleLabel: string
  joinedAt?: string | null
  isViewer?: boolean
}

export interface TeamInvite {
  id: string
  email: string
  note: string
  token: string
  status: 'pending' | 'accepted' | 'expired'
  expiresAt: string
  invitedAt: string
  acceptedAt: string | null
  invitedBy: {
    id: string
    name: string
    nameId: string
    email: string | null
  } | null
  acceptedBy?: {
    id: string
    name: string
    nameId: string
    email: string | null
  } | null
  targetUser?: {
    id: string
    name: string
    nameId: string
    email: string | null
  } | null
}

export interface TeamJoinRequest {
  id: string
  status: 'pending' | 'approved' | 'declined'
  message: string
  createdAt: string
  decidedAt: string | null
  user: {
    id: string
    name: string
    nameId: string
    email: string
    image: string | null
  }
}

export interface TeamManageData {
  id: string
  name: string
  nameId: string
  description: string
  location: string
  coverImage: string
  visibility: 'public' | 'protected' | 'private'
  requireApproval: boolean
  maxMembers: number | null
  memberCount: number
  members: TeamMember[]
  joinRequests: TeamJoinRequest[]
  invites: TeamInvite[]
}

export interface TeamViewerState {
  isAuthenticated: boolean
  isMember: boolean
  role: TeamRole
  hasPendingRequest: boolean
  requestStatus: 'pending' | 'approved' | 'declined' | null
  canRequestToJoin: boolean
  requestId: string | null
  belongsToOtherTeam: boolean
}

export interface TeamDetail {
  id: string
  name: string
  nameId: string
  description: string
  location: string
  coverImage: string
  visibility: 'public' | 'protected' | 'private'
  requireApproval: boolean
  maxMembers: number | null
  memberCount: number
  createdAt: string | null
  admin: {
    id: string
    name: string
    nameId: string
    image: string | null
  } | null
  members: Array<{
    id: string
    name: string
    nameId: string
    image: string | null
    role: TeamRole
    roleLabel: string
  }>
  viewer: TeamViewerState
}

export interface TeamSearchItem {
  id: string
  name: string
  nameId: string
  description: string
  location: string
  createdAt: string | null
  coverImage: string
  visibility: 'public' | 'protected' | 'private'
  requireApproval: boolean
  maxMembers: number | null
  memberCount: number
  admin: {
    id: string
    name: string
    nameId: string
    image: string | null
  } | null
  previewMembers: Array<{
    id: string
    name: string
    nameId: string
    image: string | null
    role: TeamRole
  }>
  viewer: {
    isMember: boolean
    hasTeam: boolean
    requestStatus: 'pending' | 'approved' | 'declined' | null
    requestId: string | null
    belongsToOtherTeam: boolean
  }
}
