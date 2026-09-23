import { prisma } from "@/lib/prisma"
import { parseDate, parseEndDate } from "@/lib/date-utils"

export interface AttendanceData {
    officeCount: number
    remoteCount: number
}

export async function computeAttendanceData(
    userId: string,
    startDate: string,
    endDate: string
): Promise<AttendanceData> {
    const dateRange = {
        gte: parseDate(startDate),
        lte: parseEndDate(endDate),
    }

    const [workDays, wfhDays] = await Promise.all([
        prisma.dailyHourSummary.findMany({
            where: {
                userId,
                date: dateRange,
                type: "WORK",
                trackedHours: {
                    gt: 0,
                },
            },
            select: {
                date: true,
            },
            distinct: ["date"],
        }),
        prisma.dailyHourSummary.findMany({
            where: {
                userId,
                date: dateRange,
                type: "WORK_FROM_HOME",
                trackedHours: {
                    gt: 0,
                },
            },
            select: {
                date: true,
            },
            distinct: ["date"],
        }),
    ])

    return { officeCount: workDays.length, remoteCount: wfhDays.length }
}
