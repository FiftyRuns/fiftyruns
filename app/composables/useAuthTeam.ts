import { useState } from 'nuxt/app'
import { useAuthUser } from './useAuthUser'
import type { AuthTeam, TeamRole } from '../types/team'

export const useAuthTeam = () => useState<AuthTeam | null>('auth-team', () => null)

type AuthTeamLike = {
  id: string
  name: string
  nameId: string
  role?: TeamRole | null
  roleLabel?: string | null
} | null

const deriveRole = (role?: TeamRole | null, roleLabel?: string | null): TeamRole => {
  if (role === 'ADMIN' || role === 'MEMBER') {
    return role
  }

  const normalized = roleLabel?.toLowerCase().trim()
  if (normalized === 'admin') {
    return 'ADMIN'
  }
  if (normalized === 'mitglied' || normalized === 'member') {
    return 'MEMBER'
  }

  return null
}

export const setAuthTeam = (team: AuthTeamLike) => {
  const authTeam = useAuthTeam()

  if (!team) {
    authTeam.value = null
    return null
  }

  const role = deriveRole(team.role ?? null, team.roleLabel ?? null)
  const fallbackLabel =
    team.roleLabel ??
    (role === 'ADMIN' ? 'Admin' : role === 'MEMBER' ? 'Mitglied' : null)

  authTeam.value = {
    id: team.id,
    name: team.name,
    nameId: team.nameId,
    role,
    roleLabel: fallbackLabel,
  }

  return authTeam.value
}

export const refreshAuthTeam = async () => {
  if (process.server) {
    return useAuthTeam().value
  }

  const authUser = useAuthUser()
  if (!authUser.value) {
    return setAuthTeam(null)
  }

  try {
    const response = await $fetch<{
      team: {
        id: string
        name: string
        nameId: string
        myRole: 'ADMIN' | 'MEMBER' | null
      } | null
    }>('/api/team/me', { credentials: 'include' })

    if (!response.team) {
      return setAuthTeam(null)
    }

    return setAuthTeam({
      id: response.team.id,
      name: response.team.name,
      nameId: response.team.nameId,
      role: response.team.myRole,
      roleLabel:
        response.team.myRole === 'ADMIN'
          ? 'Admin'
          : response.team.myRole === 'MEMBER'
            ? 'Mitglied'
            : null,
    })
  } catch (error) {
    if (process.dev) {
      console.error('[useAuthTeam] Teamzugehörigkeit konnte nicht geladen werden.', error)
    }
    return setAuthTeam(null)
  }
}
