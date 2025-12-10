import type { ShiftLocation } from "../schemas/shift-schemas"

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
        bg: "bg-blue-100 dark:bg-blue-950",
        text: "text-blue-800 dark:text-blue-200",
        label: "Office",
    },
    HOME: {
        bg: "bg-green-100 dark:bg-green-950",
        text: "text-green-800 dark:text-green-200",
        label: "Work from Home",
    },
    VACATION: {
        bg: "bg-orange-100 dark:bg-orange-950",
        text: "text-orange-800 dark:text-orange-200",
        label: "Vacation",
    },
    SICK_LEAVE: {
        bg: "bg-red-100 dark:bg-red-950",
        text: "text-red-800 dark:text-red-200",
        label: "Sick Leave",
    },
    OTHER: {
        bg: "bg-gray-100 dark:bg-gray-800",
        text: "text-gray-800 dark:text-gray-200",
        label: "Other",
    },
}
