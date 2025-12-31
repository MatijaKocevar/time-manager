"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
    type TimeSheetEntryExportData,
    type ExportMetadata,
    DateRangeInputSchema,
} from "@/features/export"
import type { ExportFormat, ExportOptions } from "@/features/export"
import * as Papa from "papaparse"
import ExcelJS from "exceljs"

async function requireAuth() {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
        throw new Error("Unauthorized")
    }
    return session
}

// Admin multi-user exports are not supported for timesheets in this feature

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
                lt: new Date(new Date(endDate).getTime() + 86400000),
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

export async function exportTimeSheetData(input: {
    format: ExportFormat
    startDate: string
    endDate: string
}) {
    try {
        const session = await requireAuth()

        const format = input.format

        const dateValidation = DateRangeInputSchema.safeParse({
            startDate: input.startDate,
            endDate: input.endDate,
        })
        if (!dateValidation.success) {
            return { error: dateValidation.error.issues[0].message }
        }

        const { startDate, endDate } = dateValidation.data

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
            result = Papa.unparse(data)
        } else if (format === "excel") {
            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet("Timesheets")

            worksheet.columns = [
                { header: "Date", key: "date", width: 12 },
                { header: "Task", key: "taskTitle", width: 30 },
                { header: "List", key: "listName", width: 20 },
                { header: "Start Time", key: "startTime", width: 20 },
                { header: "End Time", key: "endTime", width: 20 },
                { header: "Duration (min)", key: "durationMinutes", width: 15 },
                { header: "Duration (hrs)", key: "durationHours", width: 15 },
            ]

            worksheet.getRow(1).font = { bold: true }
            worksheet.getRow(1).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE0E0E0" },
            }

            data.forEach((entry) => {
                worksheet.addRow(entry)
            })

            const buffer = await workbook.xlsx.writeBuffer()
            result = Buffer.from(buffer)
        } else {
            result = JSON.stringify(
                {
                    metadata,
                    data,
                },
                null,
                2
            )
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

export async function exportAllUsersTimeSheets(_input: ExportOptions) {
    // Disabled: timesheet exports are user-only. Do not allow exporting all users from here.
    void _input
    return { error: "Exporting all users' timesheets is not allowed from this endpoint." }
}
