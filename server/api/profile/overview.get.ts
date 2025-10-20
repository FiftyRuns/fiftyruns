// server/api/profile/overview.get.ts
import { eventHandler, createError } from 'h3'
import { prisma } from '../../utils/prisma'
import { resolveSession } from '../../utils/session'

function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds || 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${h} h ${m} min`
}

export default eventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })

  const userId = session.user.id
  const season = String(new Date().getFullYear())

  // Prefer RunningStatistic; fallback to aggregating RunningExercise of this season
  const stat = await prisma.runningStatistic.findUnique({ where: { userId } })
  let runs = 0, dist = 0, dur = 0

  if (stat && stat.season === season) {
    runs = stat.numberOfRuns
    dist = stat.distanceInMeters
    dur  = stat.durationInSeconds
  } else {
    const agg = await prisma.runningExercise.aggregate({
      _sum: { distanceInMeters: true, durationInSeconds: true },
      _count: { _all: true },
      where: { posting: { userId, season } },
    })
    runs = agg._count._all ?? 0
    dist = agg._sum.distanceInMeters ?? 0
    dur  = agg._sum.durationInSeconds ?? 0
  }

  const paceSecPerKm = dist > 0 ? Math.round(dur / (dist / 1000)) : null
  const paceLabel = paceSecPerKm != null
    ? `${Math.floor(paceSecPerKm / 60)}:${String(paceSecPerKm % 60).padStart(2, '0')} min/km`
    : '–'

  const me = await prisma.user.findUnique({
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

  const team = me?.group
    ? {
        name: me.group.name,
        description: me.group.description ?? '',
        roleLabel: me.groupRole === 'ADMIN' ? 'Team Admin' : 'Mitglied',
        members: me.group._count.users,
        location: me.group.location ?? '',
      }
    : null

  const stats = [
    { label: 'Gelaufene Kilometer', value: `${(dist / 1000).toFixed(0)} km`, hint: `Diese Saison (${season})`, icon: 'ph:road-horizon-duotone' },
    { label: 'Gesamtzeit', value: formatDuration(dur), hint: 'Trainingszeit', icon: 'ph:timer-duotone' },
    { label: 'Ø Pace', value: paceLabel, hint: 'Diese Saison', icon: 'ph:chart-line-duotone' },
    { label: 'Aktive Serien', value: `${runs} Läufe`, hint: 'Anzahl Läufe', icon: 'ph:fire-duotone' },
  ]

  return { team, stats }
})
