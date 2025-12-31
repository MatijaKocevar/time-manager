import type {
    MonthlyHourExportData,
    DailyHourData,
    TimeSheetEntryExportData,
} from "@/features/export"

import { groupDataByMonth } from "@/features/export"

function parseMonthKey(monthKey: string): { year: number; month: number } {
    const [yearStr, monthStr] = monthKey.split("-")
    return { year: Number(yearStr), month: Number(monthStr) }
}

function getDaysInMonth(year: number, month: number): string[] {
    const dates: string[] = []
    const dt = new Date(year, month - 1, 1)
    while (dt.getMonth() === month - 1) {
        const y = dt.getFullYear()
        const m = String(dt.getMonth() + 1).padStart(2, "0")
        const d = String(dt.getDate()).padStart(2, "0")
        dates.push(`${y}-${m}-${d}`)
        dt.setDate(dt.getDate() + 1)
    }
    return dates
}

function isWeekend(dateStr: string): boolean {
    const d = new Date(dateStr)
    const day = d.getDay()
    return day === 0 || day === 6
}

export function mapTimeEntriesToMonthlyExport(
    entries: TimeSheetEntryExportData[],
    options?: { userId?: string; userName?: string | null; userEmail?: string }
): MonthlyHourExportData[] {
    if (!entries || entries.length === 0) return []

    const grouped = groupDataByMonth(entries as any)

    const result: MonthlyHourExportData[] = grouped.map((g) => {
        const { monthKey, monthLabel, year, month, data } = g

        // build a map by date -> byType totals
        const dailyMap = new Map<string, { grandTotal: number; byType: Record<string, number> }>()

        for (const item of data) {
            const date = item.date
            const hours = (item.durationHours as number) || 0
            const type = "WORK"

            if (!dailyMap.has(date)) {
                dailyMap.set(date, { grandTotal: 0, byType: {} })
            }

            const cur = dailyMap.get(date)!
            cur.grandTotal += hours
            cur.byType[type] = (cur.byType[type] || 0) + hours
        }

        const allDates = getDaysInMonth(year, month)

        const dailyData: DailyHourData[] = allDates.map((date) => {
            const stored = dailyMap.get(date)
            return {
                date,
                isWeekend: isWeekend(date),
                isHoliday: false,
                grandTotal: stored ? Number(stored.grandTotal) : 0,
                byType: stored ? stored.byType : {},
            }
        })

        const totalHours = dailyData.reduce((s, d) => s + d.grandTotal, 0)
        const workingDays = dailyData.filter((d) => !d.isWeekend).length
        const expectedHours = workingDays * 8
        const overtime = Number((totalHours - expectedHours).toFixed(2))

        const hoursByType: Record<string, number> = {}
        for (const d of dailyData) {
            for (const [k, v] of Object.entries(d.byType)) {
                hoursByType[k] = (hoursByType[k] || 0) + v
            }
        }

        return {
            monthKey,
            monthLabel,
            year,
            month,
            userId: options?.userId || (entries[0]?.userId as string),
            userName: options?.userName ?? entries[0]?.userName ?? null,
            userEmail: options?.userEmail || (entries[0]?.userEmail as string),
            summaryStats: {
                workingDays,
                expectedHours,
                totalHours: Number(totalHours.toFixed(2)),
                overtime,
                hoursByType,
            },
            dailyData,
        }
    })

    return result
}

export default mapTimeEntriesToMonthlyExport
