import { prisma } from "@/lib/prisma"
import type { Prisma } from "../../prisma/generated/client"

export async function refreshDailyHourSummary(): Promise<void> {
    await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW CONCURRENTLY daily_hour_summary")
}

export async function refreshDailyHourSummaryInTransaction(
    tx: Prisma.TransactionClient
): Promise<void> {
    await tx.$executeRawUnsafe("REFRESH MATERIALIZED VIEW daily_hour_summary")
}
