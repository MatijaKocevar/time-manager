"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { HourType } from "@/../../prisma/generated/client"
import { Prisma } from "../../../../../prisma/generated/client"
import {
    generateCSV,
    generateExcel,
    generateMultiSheetExcel,
    generateJSON,
    type HourEntryExportData,
    type ExportMetadata,
} from "@/features/export"
import { ExportOptionsSchema, type ExportOptions } from "@/features/export"

async function requireAuth() {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
        throw new Error("Unauthorized")
    }
    return session
}

async function requireAdmin() {
    const session = await getServerSession(authConfig)
    if (!session?.user || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized - Admin access required")
    }
    return session
}

function formatDateKey(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

async function fetchHourSummaries(
    userId: string,
    startDate: string,
    endDate: string
): Promise<HourEntryExportData[]> {
    const parseDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split("-").map(Number)
        return new Date(Date.UTC(year, month - 1, day))
    }

    const summaryQuery = Prisma.sql`
        SELECT * FROM daily_hour_summary
        WHERE "userId" = ${userId}
        AND date >= ${parseDate(startDate)}::timestamp
        AND date <= ${parseDate(endDate)}::timestamp
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

    const manualEntries = await prisma.hourEntry.findMany({
        where: {
            userId,
            taskId: null,
            date: {
                gte: parseDate(startDate),
                lte: parseDate(endDate),
            },
        },
    })

    const manualDescriptionMap = new Map<string, string | null>()
    for (const entry of manualEntries) {
        const key = `${formatDateKey(entry.date)}-${entry.type}`
        manualDescriptionMap.set(key, entry.description)
    }

    return summariesRaw.map((summary) => {
        const dateKey = formatDateKey(summary.date)
        const descKey = `${dateKey}-${summary.type}`
        const description = manualDescriptionMap.get(descKey) || null

        return {
            date: formatDateKey(summary.date),
            userId: summary.userId,
            userName: user?.name || null,
            userEmail: user?.email || "",
            type: summary.type,
            manualHours: Number(summary.manualHours),
            trackedHours: Number(summary.trackedHours),
            totalHours: Number(summary.totalHours),
            description,
        }
    })
}

export async function exportHoursData(input: ExportOptions) {
    try {
        const session = await requireAuth()

        const validation = ExportOptionsSchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const { format, startDate, endDate } = validation.data

        const data = await fetchHourSummaries(session.user.id, startDate, endDate)

        if (data.length === 0) {
            return { error: "No data found for the selected date range" }
        }

        const metadata: ExportMetadata = {
            exportDate: new Date().toISOString(),
            dateRange: { start: startDate, end: endDate },
            generatedBy: session.user.email || undefined,
            format,
        }

        let result: string | Buffer

        if (format === "csv") {
            result = generateCSV(data)
        } else if (format === "excel") {
            const columns = [
                { header: "Date", key: "date", width: 12 },
                { header: "Type", key: "type", width: 20 },
                { header: "Manual Hours", key: "manualHours", width: 15 },
                { header: "Tracked Hours", key: "trackedHours", width: 15 },
                { header: "Total Hours", key: "totalHours", width: 15 },
                { header: "Description", key: "description", width: 30 },
            ]

            const startMonth = new Date(startDate).getMonth()
            const endMonth = new Date(endDate).getMonth()
            const startYear = new Date(startDate).getFullYear()
            const endYear = new Date(endDate).getFullYear()

            const spanMultipleMonths =
                endYear > startYear || (endYear === startYear && endMonth > startMonth)

            if (spanMultipleMonths) {
                result = await generateMultiSheetExcel(data, columns, {
                    titlePrefix: "Hours Report",
                    includeFormulas: true,
                    includeSummarySheet: true,
                })
            } else {
                result = await generateExcel(data, {
                    sheetName: "Hours",
                    columns,
                    title: "Hours Report",
                    includeFormulas: true,
                })
            }
        } else {
            result = generateJSON(data, metadata)
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

        const { format, startDate, endDate, userId } = validation.data

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

        const allData: HourEntryExportData[] = []

        for (const uid of userIds) {
            const userData = await fetchHourSummaries(uid, startDate, endDate)
            allData.push(...userData)
        }

        if (allData.length === 0) {
            return { error: "No data found for the selected date range" }
        }

        allData.sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date)
            if (dateCompare !== 0) return dateCompare
            return a.userEmail.localeCompare(b.userEmail)
        })

        const metadata: ExportMetadata = {
            exportDate: new Date().toISOString(),
            dateRange: { start: startDate, end: endDate },
            generatedBy: session.user.email || undefined,
            format,
        }

        let result: string | Buffer

        if (format === "csv") {
            result = generateCSV(allData)
        } else if (format === "excel") {
            const columns = [
                { header: "Date", key: "date", width: 12 },
                { header: "User", key: "userName", width: 20 },
                { header: "Email", key: "userEmail", width: 25 },
                { header: "Type", key: "type", width: 20 },
                { header: "Manual Hours", key: "manualHours", width: 15 },
                { header: "Tracked Hours", key: "trackedHours", width: 15 },
                { header: "Total Hours", key: "totalHours", width: 15 },
                { header: "Description", key: "description", width: 30 },
            ]

            const startMonth = new Date(startDate).getMonth()
            const endMonth = new Date(endDate).getMonth()
            const startYear = new Date(startDate).getFullYear()
            const endYear = new Date(endDate).getFullYear()

            const spanMultipleMonths =
                endYear > startYear || (endYear === startYear && endMonth > startMonth)

            if (spanMultipleMonths) {
                result = await generateMultiSheetExcel(allData, columns, {
                    titlePrefix: "All Users Hours Report",
                    includeFormulas: true,
                    includeSummarySheet: true,
                })
            } else {
                result = await generateExcel(allData, {
                    sheetName: "Hours",
                    columns,
                    title: "All Users Hours Report",
                    includeFormulas: true,
                })
            }
        } else {
            result = generateJSON(allData, metadata)
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
