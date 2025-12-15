import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export async function recalculateDailySummary(
    tx: Prisma.TransactionClient,
    userId: string,
    date: Date,
    type: "WORK" | "VACATION" | "SICK_LEAVE" | "WORK_FROM_HOME" | "OTHER"
) {
    // Normalize to UTC midnight for the given date
    const normalizedDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const nextDay = new Date(normalizedDate)
    nextDay.setUTCDate(nextDay.getUTCDate() + 1)

    const manualAggregate = await tx.hourEntry.aggregate({
        where: {
            userId,
            date: {
                gte: normalizedDate,
                lt: nextDay,
            },
            type,
            taskId: null,
        },
        _sum: {
            hours: true,
        },
    })

    const startOfDay = new Date(normalizedDate)
    const endOfDay = new Date(nextDay)

    // Determine what hour type should own the tracked hours for this day
    const dateUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const approvedRequest = await tx.request.findFirst({
        where: {
            userId,
            status: "APPROVED",
            affectsHourType: true,
            startDate: { lte: dateUTC },
            endDate: { gte: dateUTC },
            cancelledAt: null,
        },
        orderBy: {
            approvedAt: "desc",
        },
    })

    let trackedHourType: "WORK" | "VACATION" | "SICK_LEAVE" | "WORK_FROM_HOME" | "OTHER" = "WORK"
    if (approvedRequest) {
        switch (approvedRequest.type) {
            case "VACATION":
                trackedHourType = "VACATION"
                break
            case "SICK_LEAVE":
                trackedHourType = "SICK_LEAVE"
                break
            case "WORK_FROM_HOME":
                trackedHourType = "WORK_FROM_HOME"
                break
            case "OTHER":
                trackedHourType = "OTHER"
                break
        }
    }

    // Only include tracked hours if this is the correct type for this day
    let trackedHours = 0
    if (type === trackedHourType) {
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
        trackedHours = (trackedAggregate._sum.duration || 0) / 3600
    }

    const manualHours = manualAggregate._sum.hours || 0
    const totalHours = manualHours + trackedHours

    if (totalHours === 0) {
        // Delete the summary if there are no hours
        await tx.dailyHourSummary.deleteMany({
            where: {
                userId,
                date: normalizedDate,
                type,
            },
        })
    } else {
        // Create or update the summary
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
