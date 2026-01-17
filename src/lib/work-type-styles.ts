export type WorkType = "WORK" | "WORK_FROM_HOME" | "VACATION" | "SICK_LEAVE" | "BREAK" | "PRIVATE"

export type WorkTypeVariant = "default" | "light" | "lighter" | "strong"

export const WORK_TYPE_COLORS: Record<WorkType, Record<WorkTypeVariant, string>> = {
    WORK: {
        default: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
        light: "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
        lighter: "bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
        strong: "bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-100",
    },
    WORK_FROM_HOME: {
        default: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
        light: "bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
        lighter: "bg-purple-50 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400",
        strong: "bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-100",
    },
    VACATION: {
        default: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
        light: "bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300",
        lighter: "bg-green-50 text-green-600 dark:bg-green-900/50 dark:text-green-400",
        strong: "bg-green-200 text-green-900 dark:bg-green-900 dark:text-green-100",
    },
    SICK_LEAVE: {
        default: "bg-[#F5E6B3] text-[#433600] dark:bg-[#2A2300] dark:text-[#D4C894]",
        light: "bg-[#FAF0CC] text-[#433600] dark:bg-[#332B00] dark:text-[#E0D4A8]",
        lighter: "bg-[#FEFBF0] text-[#5A4800] dark:bg-[#1F1A00] dark:text-[#E8DCBC]",
        strong: "bg-[#E8D89F] text-[#2A2300] dark:bg-[#332B00] dark:text-[#FAF0CC]",
    },
    BREAK: {
        default: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
        light: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
        lighter: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400",
        strong: "bg-yellow-200 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100",
    },
    PRIVATE: {
        default: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200",
        light: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
        lighter: "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-400",
        strong: "bg-cyan-200 text-cyan-900 dark:bg-cyan-900 dark:text-cyan-100",
    },
}

export type ShiftLocation = "OFFICE" | "HOME" | "VACATION" | "SICK_LEAVE"

const SHIFT_LOCATION_TO_WORK_TYPE: Record<ShiftLocation, WorkType> = {
    OFFICE: "WORK",
    HOME: "WORK_FROM_HOME",
    VACATION: "VACATION",
    SICK_LEAVE: "SICK_LEAVE",
}

export function getWorkTypeColor(
    type: WorkType | ShiftLocation,
    variant: WorkTypeVariant = "default"
): string {
    const workType =
        type in SHIFT_LOCATION_TO_WORK_TYPE
            ? SHIFT_LOCATION_TO_WORK_TYPE[type as ShiftLocation]
            : (type as WorkType)

    return WORK_TYPE_COLORS[workType]?.[variant] || WORK_TYPE_COLORS.WORK[variant]
}

export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"

export const REQUEST_STATUS_COLORS: Record<RequestStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
    APPROVED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
    REJECTED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
    CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
}

export function getRequestStatusColor(status: RequestStatus): string {
    return REQUEST_STATUS_COLORS[status] || REQUEST_STATUS_COLORS.CANCELLED
}
