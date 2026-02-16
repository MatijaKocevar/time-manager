import { z } from "zod"

export const DayInfoSchema = z.object({
    arrival: z.string().nullable(),
    departure: z.string().nullable(),
    lunchBreak: z.string().nullable(),
    totalHours: z.string().nullable(),
    overtimeWork: z.string().nullable(),
    balanceToday: z.string().nullable(),
    planned: z.string().nullable(),
    shiftEndsAt: z.string().nullable(),
    totalAnnualBalanceYesterday: z.string().nullable(),
    totalBalanceNow: z.string().nullable(),
    lastYearVacation: z.string().nullable(),
    thisYearLeave: z.string().nullable(),
    totalVacationDays: z.string().nullable(),
    setWorkTime: z.string().nullable(),
    hasArrival: z.boolean(),
    hasDeparture: z.boolean(),
    structureValid: z.boolean(),
})

export type DayInfo = z.infer<typeof DayInfoSchema>

export interface DayInfoResult {
    success: boolean
    data?: DayInfo
    error?: string
    structureValid?: boolean
}
