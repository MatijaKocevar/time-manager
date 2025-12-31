import ExcelJS from "exceljs"
import type { MonthlyHourExportData } from "../types"

export async function generateExcel(monthData: MonthlyHourExportData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(monthData.monthLabel)

    const { summaryStats, dailyData } = monthData
    const hourTypes = ["WORK", "WORK_FROM_HOME", "VACATION", "SICK_LEAVE", "OTHER"]
    const numCols = hourTypes.length + 2

    let currentRow = 1

    worksheet.mergeCells(currentRow, 1, currentRow, numCols)
    const titleCell = worksheet.getCell(currentRow, 1)
    const titleText = monthData.userName
        ? `Hours Report - ${monthData.userName} - ${monthData.monthLabel}`
        : `Hours Report - ${monthData.monthLabel}`
    titleCell.value = titleText
    titleCell.font = { bold: true, size: 14 }
    titleCell.alignment = { horizontal: "center", vertical: "middle" }
    currentRow++

    currentRow++

    worksheet.getCell(currentRow, 1).value = "Working Days:"
    worksheet.getCell(currentRow, 2).value = summaryStats.workingDays
    worksheet.getCell(currentRow, 2).font = { bold: true }
    currentRow++

    worksheet.getCell(currentRow, 1).value = "Expected Hours:"
    worksheet.getCell(currentRow, 2).value = summaryStats.expectedHours
    worksheet.getCell(currentRow, 2).font = { bold: true }
    currentRow++

    worksheet.getCell(currentRow, 1).value = "Total Hours:"
    worksheet.getCell(currentRow, 2).value = summaryStats.totalHours
    worksheet.getCell(currentRow, 2).font = { bold: true }
    currentRow++

    worksheet.getCell(currentRow, 1).value = "Overtime:"
    worksheet.getCell(currentRow, 2).value = summaryStats.overtime
    worksheet.getCell(currentRow, 2).font = { bold: true }
    const overtimeCell = worksheet.getCell(currentRow, 2)
    if (summaryStats.overtime > 0) {
        overtimeCell.font = { bold: true, color: { argb: "FFDC2626" } }
    } else if (summaryStats.overtime < 0) {
        overtimeCell.font = { bold: true, color: { argb: "FFEA580C" } }
    } else {
        overtimeCell.font = { bold: true, color: { argb: "FF16A34A" } }
    }
    currentRow++

    currentRow++

    hourTypes.forEach((type) => {
        const typeLabel = type.replace(/_/g, " ")
        worksheet.getCell(currentRow, 1).value = `${typeLabel}:`
        worksheet.getCell(currentRow, 2).value = summaryStats.hoursByType[type] || 0
        worksheet.getCell(currentRow, 2).font = { bold: true }
        currentRow++
    })

    currentRow++

    const headerRow = currentRow
    worksheet.getCell(headerRow, 1).value = "Date"
    worksheet.getCell(headerRow, 1).font = { bold: true }
    worksheet.getCell(headerRow, 1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
    }

    hourTypes.forEach((type, index) => {
        const col = index + 2
        const typeLabel = type.replace(/_/g, " ")
        const cell = worksheet.getCell(headerRow, col)
        cell.value = typeLabel
        cell.font = { bold: true }
        cell.alignment = { horizontal: "center", vertical: "middle" }
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
        }
    })

    const totalCol = hourTypes.length + 2
    worksheet.getCell(headerRow, totalCol).value = "Total"
    worksheet.getCell(headerRow, totalCol).font = { bold: true }
    worksheet.getCell(headerRow, totalCol).alignment = { horizontal: "center", vertical: "middle" }
    worksheet.getCell(headerRow, totalCol).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
    }
    currentRow++

    dailyData.forEach((day) => {
        const dateRow = currentRow
        const date = new Date(day.date)
        const dateStr = date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
        })

        let dateLabel = dateStr
        if (day.isHoliday && day.holidayName) {
            dateLabel += ` (${day.holidayName})`
        }

        const dateCell = worksheet.getCell(dateRow, 1)
        dateCell.value = dateLabel
        dateCell.alignment = { horizontal: "left" }

        if (day.isHoliday) {
            dateCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF3E8FF" },
            }
            dateCell.font = { bold: true }
        } else if (day.isWeekend) {
            dateCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF3F4F6" },
            }
        }

        hourTypes.forEach((type, index) => {
            const col = index + 2
            const cell = worksheet.getCell(dateRow, col)
            const hours = day.byType[type] || 0
            cell.value = hours
            cell.numFmt = "0.00"
            cell.alignment = { horizontal: "center" }

            if (day.isHoliday) {
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFF3E8FF" },
                }
            } else if (day.isWeekend) {
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFF3F4F6" },
                }
            }
        })

        const totalCell = worksheet.getCell(dateRow, totalCol)
        totalCell.value = day.grandTotal
        totalCell.numFmt = "0.00"
        totalCell.font = { bold: true }
        totalCell.alignment = { horizontal: "center" }

        if (day.isHoliday) {
            totalCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF3E8FF" },
            }
        } else if (day.isWeekend) {
            totalCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF3F4F6" },
            }
        }

        currentRow++
    })

    const totalRow = currentRow
    worksheet.getCell(totalRow, 1).value = "TOTAL"
    worksheet.getCell(totalRow, 1).font = { bold: true }
    worksheet.getCell(totalRow, 1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
    }

    const dataStartRow = headerRow + 1
    const dataEndRow = totalRow - 1

    hourTypes.forEach((type, index) => {
        const col = index + 2
        const colLetter = String.fromCharCode(64 + col)
        const cell = worksheet.getCell(totalRow, col)
        cell.value = {
            formula: `SUM(${colLetter}${dataStartRow}:${colLetter}${dataEndRow})`,
        }
        cell.numFmt = "0.00"
        cell.font = { bold: true }
        cell.alignment = { horizontal: "center" }
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
        }
    })

    const grandTotalCell = worksheet.getCell(totalRow, totalCol)
    const totalColLetter = String.fromCharCode(64 + totalCol)
    grandTotalCell.value = {
        formula: `SUM(${totalColLetter}${dataStartRow}:${totalColLetter}${dataEndRow})`,
    }
    grandTotalCell.numFmt = "0.00"
    grandTotalCell.font = { bold: true }
    grandTotalCell.alignment = { horizontal: "center" }
    grandTotalCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
    }

    worksheet.getColumn(1).width = 25
    for (let i = 2; i <= numCols; i++) {
        worksheet.getColumn(i).width = 15
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

export async function generateMultiSheetExcel(
    monthlyDataArray: MonthlyHourExportData[]
): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()

    for (const monthData of monthlyDataArray) {
        const sheetName = monthData.monthKey
        const worksheet = workbook.addWorksheet(sheetName)

        const { summaryStats, dailyData } = monthData
        const hourTypes = ["WORK", "WORK_FROM_HOME", "VACATION", "SICK_LEAVE", "OTHER"]
        const numCols = hourTypes.length + 2

        let currentRow = 1

        worksheet.mergeCells(currentRow, 1, currentRow, numCols)
        const titleCell = worksheet.getCell(currentRow, 1)
        const titleText = monthData.userName
            ? `Hours Report - ${monthData.userName} - ${monthData.monthLabel}`
            : `Hours Report - ${monthData.monthLabel}`
        titleCell.value = titleText
        titleCell.font = { bold: true, size: 14 }
        titleCell.alignment = { horizontal: "center", vertical: "middle" }
        currentRow++

        currentRow++

        worksheet.getCell(currentRow, 1).value = "Working Days:"
        worksheet.getCell(currentRow, 2).value = summaryStats.workingDays
        worksheet.getCell(currentRow, 2).font = { bold: true }
        currentRow++

        worksheet.getCell(currentRow, 1).value = "Expected Hours:"
        worksheet.getCell(currentRow, 2).value = summaryStats.expectedHours
        worksheet.getCell(currentRow, 2).font = { bold: true }
        currentRow++

        worksheet.getCell(currentRow, 1).value = "Total Hours:"
        worksheet.getCell(currentRow, 2).value = summaryStats.totalHours
        worksheet.getCell(currentRow, 2).font = { bold: true }
        currentRow++

        worksheet.getCell(currentRow, 1).value = "Overtime:"
        worksheet.getCell(currentRow, 2).value = summaryStats.overtime
        worksheet.getCell(currentRow, 2).font = { bold: true }
        const overtimeCell = worksheet.getCell(currentRow, 2)
        if (summaryStats.overtime > 0) {
            overtimeCell.font = { bold: true, color: { argb: "FFDC2626" } }
        } else if (summaryStats.overtime < 0) {
            overtimeCell.font = { bold: true, color: { argb: "FFEA580C" } }
        } else {
            overtimeCell.font = { bold: true, color: { argb: "FF16A34A" } }
        }
        currentRow++

        currentRow++

        hourTypes.forEach((type) => {
            const typeLabel = type.replace(/_/g, " ")
            worksheet.getCell(currentRow, 1).value = `${typeLabel}:`
            worksheet.getCell(currentRow, 2).value = summaryStats.hoursByType[type] || 0
            worksheet.getCell(currentRow, 2).font = { bold: true }
            currentRow++
        })

        currentRow++

        const headerRow = currentRow
        worksheet.getCell(headerRow, 1).value = "Date"
        worksheet.getCell(headerRow, 1).font = { bold: true }
        worksheet.getCell(headerRow, 1).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
        }

        hourTypes.forEach((type, index) => {
            const col = index + 2
            const typeLabel = type.replace(/_/g, " ")
            const cell = worksheet.getCell(headerRow, col)
            cell.value = typeLabel
            cell.font = { bold: true }
            cell.alignment = { horizontal: "center", vertical: "middle" }
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE0E0E0" },
            }
        })

        const totalCol = hourTypes.length + 2
        worksheet.getCell(headerRow, totalCol).value = "Total"
        worksheet.getCell(headerRow, totalCol).font = { bold: true }
        worksheet.getCell(headerRow, totalCol).alignment = {
            horizontal: "center",
            vertical: "middle",
        }
        worksheet.getCell(headerRow, totalCol).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
        }
        currentRow++

        dailyData.forEach((day) => {
            const dateRow = currentRow
            const date = new Date(day.date)
            const dateStr = date.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
            })

            let dateLabel = dateStr
            if (day.isHoliday && day.holidayName) {
                dateLabel += ` (${day.holidayName})`
            }

            const dateCell = worksheet.getCell(dateRow, 1)
            dateCell.value = dateLabel
            dateCell.alignment = { horizontal: "left" }

            if (day.isHoliday) {
                dateCell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFF3E8FF" },
                }
                dateCell.font = { bold: true }
            } else if (day.isWeekend) {
                dateCell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFF3F4F6" },
                }
            }

            hourTypes.forEach((type, index) => {
                const col = index + 2
                const cell = worksheet.getCell(dateRow, col)
                const hours = day.byType[type] || 0
                cell.value = hours
                cell.numFmt = "0.00"
                cell.alignment = { horizontal: "center" }

                if (day.isHoliday) {
                    cell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFF3E8FF" },
                    }
                } else if (day.isWeekend) {
                    cell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFF3F4F6" },
                    }
                }
            })

            const totalCell = worksheet.getCell(dateRow, totalCol)
            totalCell.value = day.grandTotal
            totalCell.numFmt = "0.00"
            totalCell.font = { bold: true }
            totalCell.alignment = { horizontal: "center" }

            if (day.isHoliday) {
                totalCell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFF3E8FF" },
                }
            } else if (day.isWeekend) {
                totalCell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFF3F4F6" },
                }
            }

            currentRow++
        })

        const totalRow = currentRow
        worksheet.getCell(totalRow, 1).value = "TOTAL"
        worksheet.getCell(totalRow, 1).font = { bold: true }
        worksheet.getCell(totalRow, 1).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
        }

        const dataStartRow = headerRow + 1
        const dataEndRow = totalRow - 1

        hourTypes.forEach((type, index) => {
            const col = index + 2
            const colLetter = String.fromCharCode(64 + col)
            const cell = worksheet.getCell(totalRow, col)
            cell.value = {
                formula: `SUM(${colLetter}${dataStartRow}:${colLetter}${dataEndRow})`,
            }
            cell.numFmt = "0.00"
            cell.font = { bold: true }
            cell.alignment = { horizontal: "center" }
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE0E0E0" },
            }
        })

        const grandTotalCell = worksheet.getCell(totalRow, totalCol)
        const totalColLetter = String.fromCharCode(64 + totalCol)
        grandTotalCell.value = {
            formula: `SUM(${totalColLetter}${dataStartRow}:${totalColLetter}${dataEndRow})`,
        }
        grandTotalCell.numFmt = "0.00"
        grandTotalCell.font = { bold: true }
        grandTotalCell.alignment = { horizontal: "center" }
        grandTotalCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
        }

        worksheet.getColumn(1).width = 25
        for (let i = 2; i <= numCols; i++) {
            worksheet.getColumn(i).width = 15
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

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
}
