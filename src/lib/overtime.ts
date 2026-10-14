import { prisma } from "@/lib/prisma"
import { calculateExpectedHoursToDate } from "@/lib/balance-helpers"
import { calculateOvertimeUseHours, type OvertimeRequestLike } from "@/lib/overtime-helpers"
import type { Prisma } from "../../prisma/generated/client"

export interface OvertimeRequestSource {
    isFullDay: boolean
    startDate: Date
    endDate: Date
    requestedHours: Prisma.Decimal | number | null
    skipWeekends: boolean
    skipHolidays: boolean
}

export function toOvertimeRequestLike(request: OvertimeRequestSource): OvertimeRequestLike {
    return {
        isFullDay: request.isFullDay,
        startDate: request.startDate,
        endDate: request.endDate,
        requestedHours: request.requestedHours !== null ? Number(request.requestedHours) : null,
        skipWeekends: request.skipWeekends,
        skipHolidays: request.skipHolidays,
    }
}

export async function getRequestOvertimeHours(
    request: OvertimeRequestSource,
    workHoursPerDay: number
): Promise<number> {
    const holidays = request.skipHolidays
        ? await prisma.holiday.findMany({
              where: { date: { gte: request.startDate, lte: request.endDate } },
          })
        : []

    return calculateOvertimeUseHours(toOvertimeRequestLike(request), workHoursPerDay, holidays)
}

export async function calculateOvertimeFund(userId: string, year: number): Promise<number> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { workHoursPerDay: true },
    })

    const workHoursPerDay = user?.workHoursPerDay || 8

    const today = new Date()
    const startOfYear = new Date(Date.UTC(year, 0, 1))
    const endDate =
        year === today.getFullYear()
            ? new Date(
                  Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
              )
            : new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))

    const holidays = await prisma.holiday.findMany({
        where: { date: { gte: startOfYear, lte: endDate } },
    })

    let balance = 0
    const currentMonth = year === today.getFullYear() ? today.getMonth() : 11

    for (let month = 0; month <= currentMonth; month++) {
        const monthStart = new Date(Date.UTC(year, month, 1))
        const monthEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999))

        const monthSummaries = await prisma.dailyHourSummary.findMany({
            where: {
                userId,
                date: { gte: monthStart, lte: monthEnd },
            },
        })

        const monthHours = monthSummaries.reduce(
            (sum, summary) =>
                summary.type === "OVERTIME_USE" ? sum : sum + Number(summary.totalHours),
            0
        )

        const monthStartLocal = new Date(year, month, 1)
        const monthEndLocal = new Date(year, month + 1, 0)

        const monthExpectedHours = calculateExpectedHoursToDate(
            monthStartLocal,
            monthEndLocal,
            holidays,
            workHoursPerDay
        )

        balance += monthHours - monthExpectedHours
    }

    return balance
}

export interface OvertimeAvailability {
    fund: number
    pendingHours: number
    available: number
    workHoursPerDay: number
}

export function formatOvertimeHours(hours: number): string {
    return `${Math.round(hours * 100) / 100}h`
}

export async function getOvertimeAvailability(
    userId: string,
    excludeRequestId?: string
): Promise<OvertimeAvailability> {
    const year = new Date().getFullYear()

    const [fund, user, pendingRequests] = await Promise.all([
        calculateOvertimeFund(userId, year),
        prisma.user.findUnique({
            where: { id: userId },
            select: { workHoursPerDay: true },
        }),
        prisma.request.findMany({
            where: {
                userId,
                type: "OVERTIME_USE",
                status: "PENDING",
                ...(excludeRequestId ? { id: { not: excludeRequestId } } : {}),
            },
            select: {
                isFullDay: true,
                startDate: true,
                endDate: true,
                requestedHours: true,
                skipWeekends: true,
                skipHolidays: true,
            },
        }),
    ])

    const workHoursPerDay = user?.workHoursPerDay || 8

    let pendingHours = 0

    if (pendingRequests.length > 0) {
        const rangeStart = new Date(Math.min(...pendingRequests.map((r) => r.startDate.getTime())))
        const rangeEnd = new Date(Math.max(...pendingRequests.map((r) => r.endDate.getTime())))

        const holidays = await prisma.holiday.findMany({
            where: { date: { gte: rangeStart, lte: rangeEnd } },
        })

        for (const request of pendingRequests) {
            pendingHours += calculateOvertimeUseHours(
                toOvertimeRequestLike(request),
                workHoursPerDay,
                holidays
            )
        }
    }

    return {
        fund,
        pendingHours,
        available: fund - pendingHours,
        workHoursPerDay,
    }
}
