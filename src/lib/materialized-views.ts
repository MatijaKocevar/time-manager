import { prisma } from "@/lib/prisma"

export async function refreshDailyHourSummary(): Promise<void> {
    await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW CONCURRENTLY daily_hour_summary")
}
