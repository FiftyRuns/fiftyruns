export type NotificationCategory =
  | 'REACTION'
  | 'COMMENT'
  | 'TEAM'
  | 'RUN'
  | 'SYSTEM'
  | 'INTEGRATION'

export type NotificationActionType = 'TEAM_JOIN_REQUEST'

export type TeamJoinRequestStatus = 'PENDING' | 'APPROVED' | 'DECLINED'

export type TeamJoinRequestActionPayload = {
  requestId: string
  status: TeamJoinRequestStatus
  createdAt?: string
  decidedAt?: string
  decidedBy?: {
    id: string
    name: string
  } | null
  group?: {
    id: string
    name: string
    nameId: string | null
  } | null
  requester?: {
    id: string
    name: string
    nameId?: string
    image?: string | null
  } | null
  message?: string | null
}

export type NotificationAction =
  | {
      type: 'TEAM_JOIN_REQUEST'
      payload: TeamJoinRequestActionPayload | null
    }

export type NotificationRecord = {
  id: string
  category: NotificationCategory
  type: string
  title: string
  message: string
  link: string | null
  data: Record<string, unknown> | null
  action: NotificationAction | null
  joinRequestId: string | null
  createdAt: string
  isRead: boolean
}

export type NotificationFilterKey = 'ALL' | NotificationCategory

export type NotificationFilter = {
  key: NotificationFilterKey
  label: string
  unread: number
  total: number
}
