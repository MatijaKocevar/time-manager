import type { ExportMetadata, MonthlyHourExportData } from "../types"

export function generateJSON(
    monthlyDataArray: MonthlyHourExportData[],
    metadata?: ExportMetadata
): string {
    const output = {
        metadata: metadata || {
            exportDate: new Date().toISOString(),
            format: "json" as const,
        },
        data: monthlyDataArray,
        summary: {
            totalMonths: monthlyDataArray.length,
            months: monthlyDataArray.map((m) => m.monthKey),
        },
    }

    return JSON.stringify(output, null, 2)
}

export function generateJSONCompact(monthlyDataArray: MonthlyHourExportData[]): string {
    return JSON.stringify(monthlyDataArray)
}
