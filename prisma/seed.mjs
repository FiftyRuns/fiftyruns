import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // --- Beispiel-Gruppe ---
  const group = await prisma.group.upsert({
    where: { name: 'Runners Club' },
    update: {},
    create: {
      id: randomUUID(),
      name: 'Runners Club',
      nameId: 'runners-club',
    },
  })

  // --- Beispiel-User ---
  const user = await prisma.user.upsert({
    where: { email: 'demo@fiftyruns.app' },
    update: {},
    create: {
      id: randomUUID(),
      name: 'Demo User',
      nameId: 'demo-user',
      email: 'demo@fiftyruns.app',
      password: 'hashed-password', // TODO: echten Hash setzen
      emailVerified: true,
      groupId: group.id,
    },
  })

  // --- Beispiel-Challenge ---
  const challenge = await prisma.challenge.upsert({
    where: { nameId: 'oktober-lauf-challenge' },
    update: {},
    create: {
      id: randomUUID(),
      name: 'Oktober Lauf Challenge',
      nameId: 'oktober-lauf-challenge',
      description: 'Laufe im Oktober mindestens 100 km!',
      prize: '50RUNS T-Shirt',
      image: '/images/challenges/october.png',
      startAt: new Date('2025-10-01'),
      endAt: new Date('2025-10-31'),
      goalType: 'DISTANCE',
      goalDistanceMeters: 100000,
      visibility: 'public',
      sponsorLogos: ['/images/sponsors/run4fun.png'],
      adminUserId: user.id,
      groupId: group.id,
    },
  })

  // --- Challenge-Mitglied ---
  await prisma.challengeMember.upsert({
    where: {
      challengeId_userId: { challengeId: challenge.id, userId: user.id },
    },
    update: {},
    create: {
      id: randomUUID(),
      challengeId: challenge.id,
      userId: user.id,
    },
  })

  // --- Highscore-Eintrag ---
  await prisma.challengeHighscore.upsert({
    where: {
      challengeId_userId: { challengeId: challenge.id, userId: user.id },
    },
    update: {
      runsCount: 1,
      distanceInMeters: 5000,
      durationInSeconds: 1500,
      progressPercent: 5,
    },
    create: {
      id: randomUUID(),
      challengeId: challenge.id,
      userId: user.id,
      runsCount: 1,
      distanceInMeters: 5000,
      durationInSeconds: 1500,
      progressPercent: 5,
    },
  })

  // --- Beispiel-Posting (mit Lauf) ---
  const post = await prisma.posting.create({
    data: {
      id: randomUUID(),
      date: new Date(),
      text: 'Erster Lauf der Challenge!',
      userId: user.id,
      visibility: 'protected',
      season: '2025',
    },
  })

  await prisma.runningExercise.create({
    data: {
      id: randomUUID(),
      distanceInMeters: 5000,
      durationInSeconds: 1500,
      postingId: post.id,
    },
  })

  console.log('✅ Seeding complete.')
}

main()
  .catch(async (e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
