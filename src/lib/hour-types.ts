import type { HourType } from "@/../../prisma/generated/client"

export const WORK_HOUR_TYPES: HourType[] = ["WORK", "WORK_FROM_HOME", "VACATION", "SICK_LEAVE"]

export const NON_WORK_HOUR_TYPES: HourType[] = ["BREAK", "PRIVATE", "OVERTIME_USE", "OFF_HOURS"]

export function countsTowardWorkHours(type: HourType): boolean {
    return WORK_HOUR_TYPES.includes(type)
}

export function isOffHours(type: HourType): boolean {
    return type === "OFF_HOURS"
}
