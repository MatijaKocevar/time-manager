import type { HourType } from "@/../../prisma/generated/client"
import { HOUR_TYPE_VALUES } from "../constants/hour-types"

export type HourTypeTranslationKey =
    | "work"
    | "workFromHome"
    | "vacation"
    | "sickLeave"
    | "other"
    | "break"
    | "private"

const HOUR_TYPE_TO_TRANSLATION_KEY: Record<HourType, HourTypeTranslationKey> = {
    [HOUR_TYPE_VALUES.WORK]: "work",
    [HOUR_TYPE_VALUES.WORK_FROM_HOME]: "workFromHome",
    [HOUR_TYPE_VALUES.VACATION]: "vacation",
    [HOUR_TYPE_VALUES.SICK_LEAVE]: "sickLeave",
    [HOUR_TYPE_VALUES.OTHER]: "other",
    [HOUR_TYPE_VALUES.BREAK]: "break",
    [HOUR_TYPE_VALUES.PRIVATE]: "private",
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
    BREAK: "hours.types.break",
    PRIVATE: "hours.types.private",
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

export function getTranslatedTypeLabel(
    type: string,
    tTypes: (key: HourTypeTranslationKey) => string,
    tLabels: (key: string) => string
): string {
    const { SPECIAL_TYPES, ROW_SUFFIXES } = require("../constants/hour-types")

    if (type === SPECIAL_TYPES.GRAND_TOTAL) {
        return `${tLabels("grandTotal")} (${tTypes("work")})`
    }
    if (type.endsWith(ROW_SUFFIXES.TRACKED)) {
        return tLabels("tracked")
    }
    if (type.endsWith(ROW_SUFFIXES.MANUAL)) {
        return tLabels("manual")
    }
    if (type.endsWith(ROW_SUFFIXES.TOTAL)) {
        const baseType = type.replace(ROW_SUFFIXES.TOTAL, "") as HourType
        return tTypes(getHourTypeTranslationKey(baseType))
    }
    return tTypes(getHourTypeTranslationKey(type))
}
