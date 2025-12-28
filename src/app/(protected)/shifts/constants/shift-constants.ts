import type { ShiftLocation } from "../schemas/shift-schemas"
import { getWorkTypeColor } from "@/lib/work-type-styles"

export const SHIFT_LOCATIONS = [
    { value: "OFFICE" as const, label: "Office" },
    { value: "HOME" as const, label: "Work from Home" },
    { value: "VACATION" as const, label: "Vacation" },
    { value: "SICK_LEAVE" as const, label: "Sick Leave" },
    { value: "OTHER" as const, label: "Other" },
] as const

export const SHIFT_LOCATION = {
    OFFICE: "OFFICE",
    HOME: "HOME",
    VACATION: "VACATION",
    SICK_LEAVE: "SICK_LEAVE",
    OTHER: "OTHER",
} as const

export const SHIFT_LOCATION_LABELS: Record<ShiftLocation, string> = {
    OFFICE: "Office",
    HOME: "Work from Home",
    VACATION: "Vacation",
    SICK_LEAVE: "Sick Leave",
    OTHER: "Other",
}

export const SHIFT_LOCATION_COLORS: Record<
    ShiftLocation,
    { bg: string; text: string; label: string }
> = {
    OFFICE: {
        bg: getWorkTypeColor("OFFICE", "default").split(" ").slice(0, 2).join(" "),
        text: getWorkTypeColor("OFFICE", "default").split(" ").slice(2).join(" "),
        label: "Office",
    },
    HOME: {
        bg: getWorkTypeColor("HOME", "default").split(" ").slice(0, 2).join(" "),
        text: getWorkTypeColor("HOME", "default").split(" ").slice(2).join(" "),
        label: "Work from Home",
    },
    VACATION: {
        bg: getWorkTypeColor("VACATION", "default").split(" ").slice(0, 2).join(" "),
        text: getWorkTypeColor("VACATION", "default").split(" ").slice(2).join(" "),
        label: "Vacation",
    },
    SICK_LEAVE: {
        bg: getWorkTypeColor("SICK_LEAVE", "default").split(" ").slice(0, 2).join(" "),
        text: getWorkTypeColor("SICK_LEAVE", "default").split(" ").slice(2).join(" "),
        label: "Sick Leave",
    },
    OTHER: {
        bg: getWorkTypeColor("OTHER", "default").split(" ").slice(0, 2).join(" "),
        text: getWorkTypeColor("OTHER", "default").split(" ").slice(2).join(" "),
        label: "Other",
    },
}
