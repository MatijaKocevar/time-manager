import { getTodayDayInfo } from "@/app/(protected)/clock/actions/clock-actions"
import type { DayInfo } from "@/app/(protected)/clock/schemas/day-info-schema"

export async function hasLoggedArrivalToday(): Promise<boolean> {
    const result = await getTodayDayInfo()
    return result.success && result.data ? result.data.hasArrival : false
}

export async function hasLoggedLeaveToday(): Promise<boolean> {
    const result = await getTodayDayInfo()
    return result.success && result.data ? result.data.hasDeparture : false
}

export async function getArrivalLeaveStatus(): Promise<{
    success: boolean
    data?: DayInfo
    error?: string
    structureValid?: boolean
}> {
    return await getTodayDayInfo()
}
