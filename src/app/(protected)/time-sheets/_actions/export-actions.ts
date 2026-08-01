"use server"

import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { type ExportMetadata, DateRangeInputSchema } from "@/features/export"
import type { ExportFormat } from "@/features/export"
import * as Papa from "papaparse"
import ExcelJS from "exceljs"
import { aggregateTimeEntriesByTaskAndDate } from "../_utils/aggregation-helpers"

function formatDateKey(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

function getAllDatesInRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = []
    const current = new Date(startDate)
    while (current <= endDate) {
        dates.push(new Date(current))
        current.setDate(current.getDate() + 1)
    }
    return dates
}

function formatDurationAsTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}:${String(minutes).padStart(2, "0")}`
}

async function fetchAggregatedTimeSheetData(userId: string, startDate: Date, endDate: Date) {
    const entries = await prisma.taskTimeEntry.findMany({
        where: {
            userId,
            startTime: {
                gte: startDate,
                lt: new Date(endDate.getTime() + 86400000),
            },
            endTime: {
                not: null,
            },
        },
        include: {
            task: {
                include: {
                    list: true,
                },
            },
        },
        orderBy: {
            startTime: "asc",
        },
    })

    const allDates = getAllDatesInRange(startDate, endDate)
    const aggregated = aggregateTimeEntriesByTaskAndDate(entries, allDates)

    return { aggregated, allDates }
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

        const startDate = new Date(dateValidation.data.startDate)
        const endDate = new Date(dateValidation.data.endDate)

        const { aggregated, allDates } = await fetchAggregatedTimeSheetData(
            session.user.id,
            startDate,
            endDate
        )

        const tasksArray = Array.from(aggregated.tasks.values()).sort(
            (a, b) => a.firstTrackedAt.getTime() - b.firstTrackedAt.getTime()
        )

        if (tasksArray.length === 0) {
            return { error: "No data found for the selected date range" }
        }

        const metadata: ExportMetadata = {
            exportDate: new Date().toISOString(),
            dateRange: { start: input.startDate, end: input.endDate },
            generatedBy: session.user.email || undefined,
            format,
        }

        let result: string | Buffer

        if (format === "csv") {
            const headers = ["Task", "List", ...allDates.map((d) => formatDateKey(d)), "Total"]
            const rows: string[][] = []

            tasksArray.forEach((task) => {
                const row = [
                    task.taskTitle,
                    task.listName,
                    ...allDates.map((date) => {
                        const dateKey = formatDateKey(date)
                        const seconds = task.byDate.get(dateKey) || 0
                        return seconds > 0 ? formatDurationAsTime(seconds) : "-"
                    }),
                    formatDurationAsTime(task.totalDuration),
                ]
                rows.push(row)
            })

            const dailyTotalsRow = [
                "Daily Total",
                "",
                ...allDates.map((date) => {
                    const dateKey = formatDateKey(date)
                    let total = 0
                    tasksArray.forEach((task) => {
                        total += task.byDate.get(dateKey) || 0
                    })
                    return total > 0 ? formatDurationAsTime(total) : "-"
                }),
                formatDurationAsTime(tasksArray.reduce((sum, task) => sum + task.totalDuration, 0)),
            ]
            rows.push(dailyTotalsRow)

            result = Papa.unparse({ fields: headers, data: rows })
        } else if (format === "excel") {
            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet("Timesheets")

            const numCols = allDates.length + 3
            let currentRow = 1

            worksheet.mergeCells(currentRow, 1, currentRow, numCols)
            const titleCell = worksheet.getCell(currentRow, 1)
            titleCell.value = `Time Sheets - ${formatDateKey(startDate)} to ${formatDateKey(endDate)}`
            titleCell.font = { bold: true, size: 14 }
            titleCell.alignment = { horizontal: "center", vertical: "middle" }
            currentRow++

            currentRow++

            const headerRow = currentRow
            worksheet.getCell(headerRow, 1).value = "Task"
            worksheet.getCell(headerRow, 2).value = "List"

            allDates.forEach((date, index) => {
                const col = index + 3
                const cell = worksheet.getCell(headerRow, col)
                cell.value = formatDateKey(date)
                cell.font = { bold: true }
                cell.alignment = { horizontal: "center", vertical: "middle" }
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFE0E0E0" },
                }
            })

            worksheet.getCell(headerRow, numCols).value = "Total"
            worksheet.getCell(headerRow, 1).font = { bold: true }
            worksheet.getCell(headerRow, 2).font = { bold: true }
            worksheet.getCell(headerRow, numCols).font = { bold: true }
            worksheet.getCell(headerRow, 1).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE0E0E0" },
            }
            worksheet.getCell(headerRow, 2).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE0E0E0" },
            }
            worksheet.getCell(headerRow, numCols).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE0E0E0" },
            }
            currentRow++

            tasksArray.forEach((task) => {
                const taskRow = currentRow
                worksheet.getCell(taskRow, 1).value = task.taskTitle
                worksheet.getCell(taskRow, 2).value = task.listName

                allDates.forEach((date, index) => {
                    const col = index + 3
                    const dateKey = formatDateKey(date)
                    const seconds = task.byDate.get(dateKey) || 0
                    const cell = worksheet.getCell(taskRow, col)
                    if (seconds > 0) {
                        cell.value = seconds / 86400
                        cell.numFmt = "[h]:mm"
                    } else {
                        cell.value = "-"
                    }
                    cell.alignment = { horizontal: "center" }
                })

                const totalCell = worksheet.getCell(taskRow, numCols)
                totalCell.value = task.totalDuration / 86400
                totalCell.numFmt = "[h]:mm"
                totalCell.font = { bold: true }
                totalCell.alignment = { horizontal: "center" }

                currentRow++
            })

            const totalRow = currentRow
            worksheet.getCell(totalRow, 1).value = "Daily Total"
            worksheet.getCell(totalRow, 1).font = { bold: true }
            worksheet.getCell(totalRow, 1).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE0E0E0" },
            }
            worksheet.getCell(totalRow, 2).value = ""
            worksheet.getCell(totalRow, 2).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE0E0E0" },
            }

            allDates.forEach((date, index) => {
                const col = index + 3
                const dateKey = formatDateKey(date)
                let total = 0
                tasksArray.forEach((task) => {
                    total += task.byDate.get(dateKey) || 0
                })
                const cell = worksheet.getCell(totalRow, col)
                if (total > 0) {
                    cell.value = total / 86400
                    cell.numFmt = "[h]:mm"
                } else {
                    cell.value = "-"
                }
                cell.font = { bold: true }
                cell.alignment = { horizontal: "center" }
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFE0E0E0" },
                }
            })

            const grandTotalCell = worksheet.getCell(totalRow, numCols)
            const grandTotal = tasksArray.reduce((sum, task) => sum + task.totalDuration, 0)
            grandTotalCell.value = grandTotal / 86400
            grandTotalCell.numFmt = "[h]:mm"
            grandTotalCell.font = { bold: true }
            grandTotalCell.alignment = { horizontal: "center" }
            grandTotalCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE0E0E0" },
            }

            worksheet.getColumn(1).width = 30
            worksheet.getColumn(2).width = 20
            for (let i = 3; i < numCols; i++) {
                worksheet.getColumn(i).width = 12
            }
            worksheet.getColumn(numCols).width = 12

            worksheet.eachRow((row) => {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" },
                    }
                })
            })

            const buffer = await workbook.xlsx.writeBuffer()
            result = Buffer.from(buffer)
        } else {
            const exportData = {
                tasks: tasksArray.map((task) => ({
                    taskId: task.taskId,
                    taskTitle: task.taskTitle,
                    listName: task.listName,
                    status: task.status,
                    totalDuration: task.totalDuration,
                    byDate: Object.fromEntries(task.byDate),
                })),
                dates: allDates.map((d) => formatDateKey(d)),
            }
            result = JSON.stringify(
                {
                    metadata,
                    data: exportData,
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
