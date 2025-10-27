import { defineNitroTask } from 'nitropack'
import { prisma } from '../utils/prisma'

const RETENTION_DAYS = 14
const CRON_SCHEDULE = '0 3 * * *' // Every day at 03:00 server time

export default defineNitroTask({
  name: 'cleanup-notifications',
  cron: CRON_SCHEDULE,
  async run() {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)

    const { count } = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoff },
        readBy: {
          some: {},
        },
      },
    })

    if (count > 0) {
      console.info(`[cleanup-notifications] Removed ${count} notifications older than ${RETENTION_DAYS} days.`)
    }
  },
})
