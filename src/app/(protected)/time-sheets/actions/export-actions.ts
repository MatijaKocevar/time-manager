"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
    generateCSV,
    generateExcel,
    generateMultiSheetExcel,
    generateJSON,
    type TimeSheetEntryExportData,
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

async function fetchTimeSheetData(
    userId: string,
    startDate: string,
    endDate: string
): Promise<TimeSheetEntryExportData[]> {
    const entries = await prisma.taskTimeEntry.findMany({
        where: {
            userId,
            startTime: {
                gte: new Date(startDate),
                lte: new Date(endDate),
            },
            endTime: {
                not: null,
            },
        },
        select: {
            id: true,
            taskId: true,
            userId: true,
            startTime: true,
            endTime: true,
            duration: true,
            task: {
                select: {
                    title: true,
                    list: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
            user: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: {
            startTime: "asc",
        },
    })

    return entries.map((entry) => {
        const durationMinutes = entry.duration ? Math.floor(entry.duration / 60) : 0
        const durationHours = entry.duration ? Number((entry.duration / 3600).toFixed(2)) : 0

        return {
            date: formatDateKey(entry.startTime),
            userId: entry.userId,
            userName: entry.user.name || null,
            userEmail: entry.user.email,
            taskId: entry.taskId,
            taskTitle: entry.task.title,
            listName: entry.task.list?.name || null,
            startTime: entry.startTime.toISOString(),
            endTime: entry.endTime?.toISOString() || "",
            durationMinutes,
            durationHours,
        }
    })
}

export async function exportTimeSheetData(input: ExportOptions) {
    try {
        const session = await requireAuth()

        const validation = ExportOptionsSchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const { format, startDate, endDate } = validation.data

        const data = await fetchTimeSheetData(session.user.id, startDate, endDate)

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
                { header: "Task", key: "taskTitle", width: 30 },
                { header: "List", key: "listName", width: 20 },
                { header: "Start Time", key: "startTime", width: 20 },
                { header: "End Time", key: "endTime", width: 20 },
                { header: "Duration (min)", key: "durationMinutes", width: 15 },
                { header: "Duration (hrs)", key: "durationHours", width: 15 },
            ]

            const startMonth = new Date(startDate).getMonth()
            const endMonth = new Date(endDate).getMonth()
            const startYear = new Date(startDate).getFullYear()
            const endYear = new Date(endDate).getFullYear()

            const spanMultipleMonths =
                endYear > startYear || (endYear === startYear && endMonth > startMonth)

            if (spanMultipleMonths) {
                result = await generateMultiSheetExcel(data, columns, {
                    titlePrefix: "Time Sheet Report",
                    includeFormulas: true,
                    includeSummarySheet: true,
                })
            } else {
                result = await generateExcel(data, {
                    sheetName: "Time Sheet",
                    columns,
                    title: "Time Sheet Report",
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
        return { error: "Failed to export time sheet data" }
    }
}

export async function exportAllUsersTimeSheets(input: ExportOptions) {
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

        const allData: TimeSheetEntryExportData[] = []

        for (const uid of userIds) {
            const userData = await fetchTimeSheetData(uid, startDate, endDate)
            allData.push(...userData)
        }

        if (allData.length === 0) {
            return { error: "No data found for the selected date range" }
        }

        allData.sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date)
            if (dateCompare !== 0) return dateCompare
            return a.startTime.localeCompare(b.startTime)
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
                { header: "Task", key: "taskTitle", width: 30 },
                { header: "List", key: "listName", width: 20 },
                { header: "Start Time", key: "startTime", width: 20 },
                { header: "End Time", key: "endTime", width: 20 },
                { header: "Duration (min)", key: "durationMinutes", width: 15 },
                { header: "Duration (hrs)", key: "durationHours", width: 15 },
            ]

            const startMonth = new Date(startDate).getMonth()
            const endMonth = new Date(endDate).getMonth()
            const startYear = new Date(startDate).getFullYear()
            const endYear = new Date(endDate).getFullYear()

            const spanMultipleMonths =
                endYear > startYear || (endYear === startYear && endMonth > startMonth)

            if (spanMultipleMonths) {
                result = await generateMultiSheetExcel(allData, columns, {
                    titlePrefix: "All Users Time Sheet Report",
                    includeFormulas: true,
                    includeSummarySheet: true,
                })
            } else {
                result = await generateExcel(allData, {
                    sheetName: "Time Sheet",
                    columns,
                    title: "All Users Time Sheet Report",
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
        return { error: "Failed to export time sheet data" }
    }
}
