import { PrismaClient } from '../prisma/generated/client'

const prisma = new PrismaClient()

async function check() {
    console.log('=== REFRESHING MATERIALIZED VIEW ===')
    await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY daily_hour_summary`
    console.log('Refreshed!\n')

    console.log('=== CHECKING DAILY HOUR SUMMARIES FOR YOUR USER ===')
    const user = await prisma.user.findUnique({
        where: { email: 'matija.kocev@gmail.com' }
    })

    if (!user) {
        console.log('User not found!')
        await prisma.$disconnect()
        return
    }

    const summaries = await prisma.$queryRaw<Array<{
        date: Date
        type: string
        manualHours: number
        trackedHours: number
        totalHours: number
    }>>`
        SELECT date, type, "manualHours", "trackedHours", "totalHours"
        FROM daily_hour_summary
        WHERE "userId" = ${user.id}
          AND date >= '2025-12-28'::date
          AND date <= '2025-12-31'::date
        ORDER BY date, type
    `

    console.log('Summaries for Dec 28-31:\n')
    summaries.forEach(s => {
        console.log(`${s.date.toISOString().split('T')[0]} | ${s.type.padEnd(15)} | Manual: ${s.manualHours}h | Tracked: ${s.trackedHours}h | Total: ${s.totalHours}h`)
    })

    await prisma.$disconnect()
}

check()
