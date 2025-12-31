"use server"

import { prisma } from "@/lib/prisma"
import type { HourType } from "@/../../prisma/generated/client"
import { Prisma } from "../../../../../prisma/generated/client"
import {
    generateCSV,
    generateExcel,
    generateMultiSheetExcel,
    generateJSON,
    type MonthlyHourExportData,
    type DailyHourData,
    type ExportMetadata,
} from "@/features/export"
import { ExportOptionsSchema, type ExportOptions } from "@/features/export"
import { requireAuth, requireAdmin } from "../utils/auth-helpers"
import { formatDateKey } from "../utils/date-helpers"
import { calculateWorkingDaysSync, calculateOvertime } from "../utils/calculation-helpers"
import { HOUR_TYPES } from "../constants/hour-types"

export async function fetchMonthlyHourData(
    userId: string,
    month: string
): Promise<MonthlyHourExportData> {
    const [year, monthNum] = month.split("-").map(Number)
    const startDate = new Date(year, monthNum - 1, 1)
    const endDate = new Date(year, monthNum, 0)

    const summaryQuery = Prisma.sql`
        SELECT * FROM daily_hour_summary
        WHERE "userId" = ${userId}
        AND date >= ${startDate}::timestamp
        AND date <= ${endDate}::timestamp
        ORDER BY date ASC`

    const summariesRaw = (await prisma.$queryRaw(summaryQuery)) as Array<{
        id: string
        userId: string
        date: Date
        type: HourType
        manualHours: number
        trackedHours: number
        totalHours: number
        createdAt: Date
        updatedAt: Date
    }>

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
    })

    const holidays = await prisma.holiday.findMany({
        where: {
            date: {
                gte: startDate,
                lte: endDate,
            },
        },
    })

    const holidayMap = new Map(holidays.map((h) => [formatDateKey(h.date), h.name]))

    const dataByDate = new Map<string, Map<string, number>>()

    for (const summary of summariesRaw) {
        const dateKey = formatDateKey(summary.date)
        if (!dataByDate.has(dateKey)) {
            dataByDate.set(dateKey, new Map())
        }
        const dateData = dataByDate.get(dateKey)!
        dateData.set(summary.type, Number(summary.totalHours))
    }

    const dailyData: DailyHourData[] = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
        const dateKey = formatDateKey(currentDate)
        const dayOfWeek = currentDate.getDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
        const isHoliday = holidayMap.has(dateKey)
        const holidayName = holidayMap.get(dateKey)

        const dateData = dataByDate.get(dateKey) || new Map()
        const byType: Record<string, number> = {}
        let grandTotal = 0

        for (const hourType of HOUR_TYPES) {
            const hours = dateData.get(hourType.value) || 0
            byType[hourType.value] = hours
            grandTotal += hours
        }

        dailyData.push({
            date: dateKey,
            isWeekend,
            isHoliday,
            holidayName,
            grandTotal,
            byType,
        })

        currentDate.setDate(currentDate.getDate() + 1)
    }

    const workingDays = calculateWorkingDaysSync(startDate, endDate, holidays)
    const expectedHours = workingDays * 8
    const totalHours = dailyData.reduce((sum, day) => sum + day.grandTotal, 0)
    const overtime = calculateOvertime(totalHours, workingDays)

    const hoursByType: Record<string, number> = {}
    for (const hourType of HOUR_TYPES) {
        hoursByType[hourType.value] = dailyData.reduce(
            (sum, day) => sum + (day.byType[hourType.value] || 0),
            0
        )
    }

    const monthLabel = startDate.toLocaleString("en-US", { month: "long", year: "numeric" })

    return {
        monthKey: month,
        monthLabel,
        year,
        month: monthNum,
        userId,
        userName: user?.name || null,
        userEmail: user?.email || "",
        summaryStats: {
            workingDays,
            expectedHours,
            totalHours,
            overtime,
            hoursByType,
        },
        dailyData,
    }
}

export async function exportHoursData(input: ExportOptions) {
    try {
        const session = await requireAuth()

        const validation = ExportOptionsSchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const { format, months } = validation.data

        const monthlyData: MonthlyHourExportData[] = []
        for (const month of months) {
            const data = await fetchMonthlyHourData(session.user.id, month)
            monthlyData.push(data)
        }

        if (monthlyData.length === 0) {
            return { error: "No data found for the selected months" }
        }

        const metadata: ExportMetadata = {
            exportDate: new Date().toISOString(),
            dateRange: {
                start: monthlyData[0].dailyData[0].date,
                end: monthlyData[monthlyData.length - 1].dailyData[
                    monthlyData[monthlyData.length - 1].dailyData.length - 1
                ].date,
            },
            generatedBy: session.user.email || undefined,
            format,
        }

        let result: string | Buffer

        if (format === "csv") {
            result = generateCSV(monthlyData)
        } else if (format === "excel") {
            if (months.length > 1) {
                result = await generateMultiSheetExcel(monthlyData)
            } else {
                result = await generateExcel(monthlyData[0])
            }
        } else {
            result = generateJSON(monthlyData, metadata)
        }

        return {
            success: true,
            data: format === "excel" ? result.toString("base64") : result,
        }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to export hours data" }
    }
}

export async function exportAllUsersHours(input: ExportOptions) {
    try {
        const session = await requireAdmin()

        const validation = ExportOptionsSchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const { format, months, userId } = validation.data

        let userIds: string[]

        if (userId) {
            userIds = [userId]
        } else {
            const users = await prisma.user.findMany({
                select: { id: true },
                where: {
                    role: {
                        in: ["USER", "ADMIN"],
                    },
                },
            })
            userIds = users.map((u) => u.id)
        }

        const allMonthlyData: MonthlyHourExportData[] = []

        for (const uid of userIds) {
            for (const month of months) {
                const userData = await fetchMonthlyHourData(uid, month)
                allMonthlyData.push(userData)
            }
        }

        if (allMonthlyData.length === 0) {
            return { error: "No data found for the selected months" }
        }

        allMonthlyData.sort((a, b) => {
            const monthCompare = a.monthKey.localeCompare(b.monthKey)
            if (monthCompare !== 0) return monthCompare
            return a.userEmail.localeCompare(b.userEmail)
        })

        const metadata: ExportMetadata = {
            exportDate: new Date().toISOString(),
            dateRange: {
                start: allMonthlyData[0].dailyData[0].date,
                end: allMonthlyData[allMonthlyData.length - 1].dailyData[
                    allMonthlyData[allMonthlyData.length - 1].dailyData.length - 1
                ].date,
            },
            generatedBy: session.user.email || undefined,
            format,
        }

        let result: string | Buffer

        if (format === "csv") {
            result = generateCSV(allMonthlyData)
        } else if (format === "excel") {
            if (months.length > 1 || userIds.length > 1) {
                result = await generateMultiSheetExcel(allMonthlyData)
            } else {
                result = await generateExcel(allMonthlyData[0])
            }
        } else {
            result = generateJSON(allMonthlyData, metadata)
        }

        return {
            success: true,
            data: format === "excel" ? result.toString("base64") : result,
        }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to export hours data" }
    }
}
