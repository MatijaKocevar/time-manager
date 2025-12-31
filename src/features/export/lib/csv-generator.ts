import * as Papa from "papaparse"
import type { MonthlyHourExportData } from "../types"

export function generateCSV(monthlyDataArray: MonthlyHourExportData[]): string {
    if (monthlyDataArray.length === 0) {
        return ""
    }

    const sections: string[] = []

    for (const monthData of monthlyDataArray) {
        const { summaryStats, dailyData, monthLabel, userName } = monthData

        const monthSection: string[] = []
        const headerText = userName
            ? `\n=== ${userName} - ${monthLabel} ===\n`
            : `\n=== ${monthLabel} ===\n`
        monthSection.push(headerText)

        monthSection.push("Summary Statistics")
        monthSection.push(`Working Days,${summaryStats.workingDays}`)
        monthSection.push(`Expected Hours,${summaryStats.expectedHours}`)
        monthSection.push(`Total Hours,${summaryStats.totalHours}`)
        monthSection.push(`Overtime,${summaryStats.overtime}`)
        monthSection.push("")

        const hourTypes = ["WORK", "WORK_FROM_HOME", "VACATION", "SICK_LEAVE", "OTHER"]

        monthSection.push("Hours by Type")
        hourTypes.forEach((type) => {
            const typeLabel = type.replace(/_/g, " ")
            monthSection.push(`${typeLabel},${summaryStats.hoursByType[type] || 0}`)
        })
        monthSection.push("")

        const headerRow = ["Date", ...hourTypes.map((t) => t.replace(/_/g, " ")), "Total"]
        monthSection.push(headerRow.join(","))

        dailyData.forEach((day) => {
            const date = new Date(day.date)
            const dateStr = date.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
            })

            const row = [
                dateStr,
                ...hourTypes.map((type) => (day.byType[type] || 0).toFixed(2)),
                day.grandTotal.toFixed(2),
            ]
            monthSection.push(row.join(","))
        })

        const totalRow = [
            "TOTAL",
            ...hourTypes.map((type) =>
                dailyData.reduce((sum, d) => sum + (d.byType[type] || 0), 0).toFixed(2)
            ),
            dailyData.reduce((sum, d) => sum + d.grandTotal, 0).toFixed(2),
        ]
        monthSection.push(totalRow.join(","))

        sections.push(monthSection.join("\n"))
    }

    return sections.join("\n\n")
}

export function parseCSVHeaders<T extends Record<string, unknown>>(data: T[]): string[] {
    if (data.length === 0) {
        return []
    }

    return Object.keys(data[0])
}
