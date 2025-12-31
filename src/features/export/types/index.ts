export type ExportFormat = "csv" | "excel" | "json"

export interface ExportMetadata {
    exportDate: string
    dateRange: {
        start: string
        end: string
    }
    generatedBy?: string
    format: ExportFormat
}

export interface HourEntryExportData extends Record<string, unknown> {
    date: string
    userId: string
    userName: string | null
    userEmail: string
    type: string
    manualHours: number
    trackedHours: number
    totalHours: number
    description: string | null
}

export interface MonthSummaryStats {
    workingDays: number
    expectedHours: number
    totalHours: number
    overtime: number
    hoursByType: Record<string, number>
}

export interface DailyHourData {
    date: string
    isWeekend: boolean
    isHoliday: boolean
    holidayName?: string
    grandTotal: number
    byType: Record<string, number>
}

export interface MonthlyHourExportData {
    monthKey: string
    monthLabel: string
    year: number
    month: number
    userId: string
    userName: string | null
    userEmail: string
    summaryStats: MonthSummaryStats
    dailyData: DailyHourData[]
}

export interface TimeSheetEntryExportData extends Record<string, unknown> {
    date: string
    userId: string
    userName: string | null
    userEmail: string
    taskId: string
    taskTitle: string
    listName: string | null
    startTime: string
    endTime: string
    durationMinutes: number
    durationHours: number
}

export interface UserExportData extends Record<string, unknown> {
    id: string
    name: string | null
    email: string
    role: string
    createdAt: string
    totalHours?: number
    workDays?: number
}

export interface MonthlyGroupedData<T> {
    monthKey: string
    monthLabel: string
    year: number
    month: number
    data: T[]
}

export interface ExportResult {
    success: boolean
    data?: string | Buffer
    filename?: string
    mimeType?: string
    error?: string
}
