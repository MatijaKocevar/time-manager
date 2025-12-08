import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export async function recalculateDailySummary(
    tx: Prisma.TransactionClient,
    userId: string,
    date: Date,
    type: "WORK" | "VACATION" | "SICK_LEAVE" | "WORK_FROM_HOME" | "OTHER"
) {
    const normalizedDate = new Date(date.getTime())
    normalizedDate.setUTCHours(0, 0, 0, 0)

    const manualAggregate = await tx.hourEntry.aggregate({
        where: {
            userId,
            date: normalizedDate,
            type,
            taskId: null,
        },
        _sum: {
            hours: true,
        },
    })

    const startOfDay = new Date(normalizedDate)
    const endOfDay = new Date(normalizedDate)
    endOfDay.setDate(endOfDay.getDate() + 1)

    const trackedAggregate = await tx.taskTimeEntry.aggregate({
        where: {
            userId,
            startTime: {
                gte: startOfDay,
                lt: endOfDay,
            },
            endTime: { not: null },
            duration: { not: null },
        },
        _sum: {
            duration: true,
        },
    })

    const manualHours = manualAggregate._sum.hours || 0
    const trackedHours = (trackedAggregate._sum.duration || 0) / 3600
    const totalHours = manualHours + trackedHours

    await tx.dailyHourSummary.upsert({
        where: {
            userId_date_type: {
                userId,
                date: normalizedDate,
                type,
            },
        },
        create: {
            userId,
            date: normalizedDate,
            type,
            manualHours,
            trackedHours,
            totalHours,
        },
        update: {
            manualHours,
            trackedHours,
            totalHours,
        },
    })
}

export async function recalculateDailySummaryStandalone(
    userId: string,
    date: Date,
    type: "WORK" | "VACATION" | "SICK_LEAVE" | "WORK_FROM_HOME" | "OTHER"
) {
    await prisma.$transaction(async (tx) => {
        await recalculateDailySummary(tx, userId, date, type)
    })
}
