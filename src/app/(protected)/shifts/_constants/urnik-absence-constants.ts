import { getWorkTypeColor } from "@/lib/work-type-styles"
import type { UrnikAbsenceBadge } from "../_schemas/urnik-absence-schemas"
import { OVERTIME_USE_BADGE_COLORS, SHIFT_LOCATION_COLORS, toColorParts } from "./shift-constants"

export const URNIK_ABSENCE_BADGE_COLORS: Record<UrnikAbsenceBadge, { bg: string; text: string }> = {
    OFFICE: SHIFT_LOCATION_COLORS.OFFICE,
    HOME: SHIFT_LOCATION_COLORS.HOME,
    VACATION: SHIFT_LOCATION_COLORS.VACATION,
    SICK_LEAVE: SHIFT_LOCATION_COLORS.SICK_LEAVE,
    OVERTIME_USE: OVERTIME_USE_BADGE_COLORS,
    BREAK: toColorParts(getWorkTypeColor("BREAK", "default")),
    ABSENCE: toColorParts("bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"),
}
