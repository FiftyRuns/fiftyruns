// server/api/profile/overview.get.ts
import { eventHandler, createError } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'

// Precompute for current season
const CURRENT_SEASON = String(new Date().getFullYear())

// Optimized duration formatting - avoid object creation and use bitwise ops
function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds || 0))
  const h = (s / 3600) | 0
  const m = ((s % 3600) / 60) | 0
  return `${h} h ${m} min`
}

// Cache pace calculation to avoid redundant computations
function calculatePace(duration: number, distance: number) {
  if (distance <= 0) return null
  
  const paceSecPerKm = Math.round(duration / (distance / 1000))
  const minutes = (paceSecPerKm / 60) | 0
  const seconds = String(paceSecPerKm % 60).padStart(2, '0')
  
  return `${minutes}:${seconds} min/km`
}

export default eventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })

  const userId = session.user.id

  // Parallelize database queries
  const [stat, userData] = await Promise.all([
    // Get running statistics
    prisma.runningStatistic.findUnique({ 
      where: { userId },
      select: {
        numberOfRuns: true,
        distanceInMeters: true,
        durationInSeconds: true,
        season: true
      }
    }),
    
    // Get user with group data in parallel
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        groupRole: true,
        group: {
          select: {
            id: true,
            name: true,
            nameId: true,
            description: true,
            location: true,
            _count: { select: { users: true } },
          },
        },
      },
    })
  ])

  let runs = 0, dist = 0, dur = 0

  // Use statistics if available and current, otherwise fallback to aggregation
  if (stat?.season === CURRENT_SEASON) {
    runs = stat.numberOfRuns
    dist = stat.distanceInMeters
    dur = stat.durationInSeconds
  } else {
    // Only query aggregation if needed
    const agg = await prisma.runningExercise.aggregate({
      _sum: { distanceInMeters: true, durationInSeconds: true },
      _count: { _all: true },
      where: { 
        posting: { 
          userId, 
          season: CURRENT_SEASON 
        } 
      },
    })
    runs = agg._count._all ?? 0
    dist = agg._sum.distanceInMeters ?? 0
    dur = agg._sum.durationInSeconds ?? 0
  }

  // Precompute values to avoid repeated calculations
  const distanceKm = (dist / 1000).toFixed(0)
  const paceLabel = calculatePace(dur, dist) || '–'

  const team = userData?.group
    ? {
        id: userData.group.id,
        name: userData.group.name,
        nameId: userData.group.nameId,
        description: userData.group.description ?? '',
        roleLabel: userData.groupRole === 'ADMIN' ? 'Admin' : 'Mitglied',
        members: userData.group._count.users,
        location: userData.group.location ?? '',
      }
    : null

  // Predefined stats array to avoid object creation at runtime
  const stats = [
    { 
      label: 'Gelaufene Kilometer', 
      value: `${distanceKm} km`, 
      hint: `Diese Saison (${CURRENT_SEASON})`, 
      icon: 'ph:road-horizon-duotone' 
    },
    { 
      label: 'Gesamtzeit', 
      value: formatDuration(dur), 
      hint: 'Trainingszeit', 
      icon: 'ph:timer-duotone' 
    },
    { 
      label: 'Ø Pace', 
      value: paceLabel, 
      hint: 'Diese Saison', 
      icon: 'ph:chart-line-duotone' 
    },
    { 
      label: 'Aktive Serien', 
      value: `${runs} Läufe`, 
      hint: 'Anzahl Läufe', 
      icon: 'ph:fire-duotone' 
    },
  ]

  return { team, stats }
})