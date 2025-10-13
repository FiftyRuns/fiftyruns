import { PrismaClient } from '@prisma/client'
import crypto from 'node:crypto'
const prisma = new PrismaClient()
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex')

async function main() {
  console.log('Seeding…')
  const group = await prisma.group.upsert({
    where: { slug: 'default' },
    update: {},
    create: { name: 'Default', slug: 'default' }
  })

  const user = await prisma.user.upsert({
    where: { email: 'demo@fifty-runs.local' },
    update: {},
    create: {
      email: 'demo@fifty-runs.local',
      emailVerified: true,
      passwordHash: sha256('demo1234'),
      name: 'Demo User',
      slug: 'demo-user'
    }
  })

  const post = await prisma.post.create({
    data: {
      authorId: user.id,
      groupId: group.id,
      type: 'POST',
      visibility: 'PUBLIC',
      text: 'Hello Stage 👋 – erster Post!'
    }
  })

  await prisma.comment.create({
    data: { postId: post.id, authorId: user.id, text: 'Erster Kommentar' }
  })

  await prisma.reaction.create({
    data: { postId: post.id, userId: user.id, type: 'LIKE' }
  })

  await prisma.runningStatistic.upsert({
    where: { userId_season: { userId: user.id, season: 2025 } },
    update: { runsCount: { increment: 1 }, distanceM: { increment: 5000 }, durationS: { increment: 1500 } },
    create: { userId: user.id, season: 2025, runsCount: 1, distanceM: 5000, durationS: 1500, donationsCent: 0 }
  })
  console.log('Seed done.')
}

main().finally(() => prisma.$disconnect())
