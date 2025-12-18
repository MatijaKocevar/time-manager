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
