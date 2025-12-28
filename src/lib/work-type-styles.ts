export type WorkType = "WORK" | "WORK_FROM_HOME" | "VACATION" | "SICK_LEAVE" | "OTHER"

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
        default: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
        light: "bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300",
        lighter: "bg-red-50 text-red-600 dark:bg-red-900/50 dark:text-red-400",
        strong: "bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-100",
    },
    OTHER: {
        default: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        light: "bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
        lighter: "bg-gray-50 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400",
        strong: "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100",
    },
}

export type ShiftLocation = "OFFICE" | "HOME" | "VACATION" | "SICK_LEAVE" | "OTHER"

const SHIFT_LOCATION_TO_WORK_TYPE: Record<ShiftLocation, WorkType> = {
    OFFICE: "WORK",
    HOME: "WORK_FROM_HOME",
    VACATION: "VACATION",
    SICK_LEAVE: "SICK_LEAVE",
    OTHER: "OTHER",
}

export function getWorkTypeColor(
    type: WorkType | ShiftLocation,
    variant: WorkTypeVariant = "default"
): string {
    const workType =
        type in SHIFT_LOCATION_TO_WORK_TYPE
            ? SHIFT_LOCATION_TO_WORK_TYPE[type as ShiftLocation]
            : (type as WorkType)

    return WORK_TYPE_COLORS[workType]?.[variant] || WORK_TYPE_COLORS.OTHER[variant]
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
