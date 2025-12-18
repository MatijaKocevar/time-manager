import type { ShiftLocation } from "../schemas/shift-schemas"

export type ShiftLocationTranslationKey = "office" | "home" | "vacation" | "sickLeave" | "other"

const SHIFT_LOCATION_TO_TRANSLATION_KEY: Record<ShiftLocation, ShiftLocationTranslationKey> = {
    OFFICE: "office",
    HOME: "home",
    VACATION: "vacation",
    SICK_LEAVE: "sickLeave",
    OTHER: "other",
}

export function getShiftLocationTranslationKey(
    location: ShiftLocation
): ShiftLocationTranslationKey {
    return SHIFT_LOCATION_TO_TRANSLATION_KEY[location] ?? "other"
}
