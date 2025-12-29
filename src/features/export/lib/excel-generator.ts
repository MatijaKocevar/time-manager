import ExcelJS from "exceljs"
import type { MonthlyGroupedData } from "../types"
import { groupDataByMonth } from "../utils/date-grouping"

interface ExcelColumn {
    header: string
    key: string
    width?: number
}

interface ExcelOptions {
    sheetName?: string
    columns: ExcelColumn[]
    title?: string
    includeFormulas?: boolean
}

export async function generateExcel<T extends Record<string, unknown>>(
    data: T[],
    options: ExcelOptions
): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(options.sheetName || "Data")

    worksheet.columns = options.columns

    if (options.title) {
        worksheet.insertRow(1, [options.title])
        const titleRow = worksheet.getRow(1)
        titleRow.font = { bold: true, size: 14 }
        titleRow.height = 20
        worksheet.mergeCells(1, 1, 1, options.columns.length)
    }

    const headerRowIndex = options.title ? 2 : 1
    const headerRow = worksheet.getRow(headerRowIndex)
    headerRow.font = { bold: true }
    headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
    }

    data.forEach((item) => {
        worksheet.addRow(item)
    })

    if (options.includeFormulas && data.length > 0) {
        const summaryRowIndex = worksheet.rowCount + 1
        const summaryRow = worksheet.getRow(summaryRowIndex)
        summaryRow.font = { bold: true }
        summaryRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF0F0F0" },
        }

        options.columns.forEach((col, index) => {
            const colLetter = String.fromCharCode(65 + index)
            const dataStartRow = headerRowIndex + 1
            const dataEndRow = summaryRowIndex - 1

            if (
                col.key.includes("hours") ||
                col.key.includes("duration") ||
                col.key === "total"
            ) {
                summaryRow.getCell(index + 1).value = {
                    formula: `SUM(${colLetter}${dataStartRow}:${colLetter}${dataEndRow})`,
                }
            } else if (index === 0) {
                summaryRow.getCell(1).value = "TOTAL"
            }
        })
    }

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
    return Buffer.from(buffer)
}

export async function generateMultiSheetExcel<T extends { date: string }>(
    data: T[],
    columns: ExcelColumn[],
    options?: {
        titlePrefix?: string
        includeFormulas?: boolean
        includeSummarySheet?: boolean
    }
): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    const groupedData = groupDataByMonth(data)

    for (const group of groupedData) {
        const worksheet = workbook.addWorksheet(group.monthLabel)

        worksheet.columns = columns

        const titleRow = worksheet.getRow(1)
        titleRow.values = [
            options?.titlePrefix
                ? `${options.titlePrefix} - ${group.monthLabel}`
                : group.monthLabel,
        ]
        titleRow.font = { bold: true, size: 14 }
        titleRow.height = 20
        worksheet.mergeCells(1, 1, 1, columns.length)

        const headerRow = worksheet.getRow(2)
        headerRow.font = { bold: true }
        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
        }

        group.data.forEach((item) => {
            worksheet.addRow(item)
        })

        if (options?.includeFormulas && group.data.length > 0) {
            const summaryRowIndex = worksheet.rowCount + 1
            const summaryRow = worksheet.getRow(summaryRowIndex)
            summaryRow.font = { bold: true }
            summaryRow.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF0F0F0" },
            }

            columns.forEach((col, index) => {
                const colLetter = String.fromCharCode(65 + index)
                const dataStartRow = 3
                const dataEndRow = summaryRowIndex - 1

                if (
                    col.key.includes("hours") ||
                    col.key.includes("duration") ||
                    col.key === "total"
                ) {
                    summaryRow.getCell(index + 1).value = {
                        formula: `SUM(${colLetter}${dataStartRow}:${colLetter}${dataEndRow})`,
                    }
                } else if (index === 0) {
                    summaryRow.getCell(1).value = "TOTAL"
                }
            })
        }

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
    }

    if (options?.includeSummarySheet && groupedData.length > 1) {
        const summarySheet = workbook.addWorksheet("Summary", { state: "visible" })
        const worksheetCount = workbook.worksheets.length
        if (worksheetCount > 1) {
            const summaryIndex = workbook.worksheets.findIndex(ws => ws.name === "Summary")
            if (summaryIndex > 0) {
                workbook.worksheets.unshift(workbook.worksheets.splice(summaryIndex, 1)[0])
            }
        }

        summarySheet.columns = [
            { header: "Month", key: "month", width: 20 },
            { header: "Total Entries", key: "totalEntries", width: 15 },
        ]

        const titleRow = summarySheet.getRow(1)
        titleRow.values = ["Summary Report"]
        titleRow.font = { bold: true, size: 14 }
        titleRow.height = 20
        summarySheet.mergeCells(1, 1, 1, 2)

        const headerRow = summarySheet.getRow(2)
        headerRow.font = { bold: true }
        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
        }

        groupedData.forEach((group) => {
            summarySheet.addRow({
                month: group.monthLabel,
                totalEntries: group.data.length,
            })
        })

        summarySheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                }
            })
        })
    }

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
}
