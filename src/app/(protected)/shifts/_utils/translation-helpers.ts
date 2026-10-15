import type { UrnikAbsenceBadge } from "../_schemas/urnik-absence-schemas"
import type { ShiftLocation } from "../_schemas/shift-schemas"

export type ShiftLocationTranslationKey = "office" | "home" | "vacation" | "sickLeave"

export type UrnikAbsenceTranslationKey =
    | ShiftLocationTranslationKey
    | "overtimeUse"
    | "break"
    | "absence"

const SHIFT_LOCATION_TO_TRANSLATION_KEY: Record<ShiftLocation, ShiftLocationTranslationKey> = {
    OFFICE: "office",
    HOME: "home",
    VACATION: "vacation",
    SICK_LEAVE: "sickLeave",
}

const URNIK_ABSENCE_TO_TRANSLATION_KEY: Record<UrnikAbsenceBadge, UrnikAbsenceTranslationKey> = {
    OFFICE: "office",
    HOME: "home",
    VACATION: "vacation",
    SICK_LEAVE: "sickLeave",
    OVERTIME_USE: "overtimeUse",
    BREAK: "break",
    ABSENCE: "absence",
}

export function getShiftLocationTranslationKey(
    location: ShiftLocation
): ShiftLocationTranslationKey {
    return SHIFT_LOCATION_TO_TRANSLATION_KEY[location] ?? "office"
}

export function getUrnikAbsenceTranslationKey(
    badge: UrnikAbsenceBadge
): UrnikAbsenceTranslationKey {
    return URNIK_ABSENCE_TO_TRANSLATION_KEY[badge] ?? "absence"
}
