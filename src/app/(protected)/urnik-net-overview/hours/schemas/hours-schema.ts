import { z } from "zod"

export const DayEntrySchema = z.object({
    number: z.number(),
    date: z.string(),
    dayOfWeek: z.string(),
    status: z.string(),
    graphColors: z.array(z.string()).nullable(),
    clockIn: z.string().nullable(),
    clockOut: z.string().nullable(),
    attendance: z.string().nullable(),
    accounted: z.string().nullable(),
    dayBalance: z.string().nullable(),
    balanceMonth: z.string().nullable(),
    balanceYear: z.string().nullable(),
})

export const MonthSummarySchema = z.object({
    billingHours: z.string().nullable(),
    plannedHours: z.string().nullable(),
    workDays: z.string().nullable(),
    holidays: z.string().nullable(),
    lunches: z.string().nullable(),
    vacationBalance: z.string().nullable(),
    sickLeave: z.string().nullable(),
    leaveDays: z.string().nullable(),
    balance: z.string().nullable(),
    workFromHome: z.string().nullable(),
    userType: z.string().nullable(),
    hoursInDay: z.string().nullable(),
})

export const ParsedHoursDataSchema = z.object({
    summary: MonthSummarySchema,
    days: z.array(DayEntrySchema),
})

export type DayEntry = z.infer<typeof DayEntrySchema>
export type MonthSummary = z.infer<typeof MonthSummarySchema>
export type ParsedHoursData = z.infer<typeof ParsedHoursDataSchema>

export const HoursDataSchema = z.object({
    rawHtml: z.string(),
    characterCount: z.number(),
})

export type HoursData = z.infer<typeof HoursDataSchema>

export interface HoursResult {
    success: boolean
    data?: HoursData
    error?: string
}

export interface ValidationWarning {
    field: string
    message: string
    severity: "warning" | "error"
}

export interface ParsedHoursResult {
    success: boolean
    data?: ParsedHoursData
    error?: string
    validationWarnings?: ValidationWarning[]
}
