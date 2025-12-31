import type { HourType } from "@/../../prisma/generated/client"

export type HourTypeTranslationKey = "work" | "workFromHome" | "vacation" | "sickLeave" | "other"

const HOUR_TYPE_TO_TRANSLATION_KEY: Record<HourType, HourTypeTranslationKey> = {
    WORK: "work",
    WORK_FROM_HOME: "workFromHome",
    VACATION: "vacation",
    SICK_LEAVE: "sickLeave",
    OTHER: "other",
}

export function getHourTypeTranslationKey(type: string): HourTypeTranslationKey {
    return HOUR_TYPE_TO_TRANSLATION_KEY[type as HourType] ?? "other"
}

export const HOUR_TYPE_KEYS: Record<HourType, string> = {
    WORK: "hours.types.work",
    WORK_FROM_HOME: "hours.types.workFromHome",
    VACATION: "hours.types.vacation",
    SICK_LEAVE: "hours.types.sickLeave",
    OTHER: "hours.types.other",
}

export function getHourTypeLabel(t: (key: string) => string, type: HourType): string {
    return t(HOUR_TYPE_KEYS[type])
}

export const HOUR_TYPE_ROW_LABELS = {
    GRAND_TOTAL: "hours.labels.grandTotal",
    TOTAL: "hours.labels.total",
    TRACKED: "hours.labels.tracked",
    MANUAL: "hours.labels.manual",
}
