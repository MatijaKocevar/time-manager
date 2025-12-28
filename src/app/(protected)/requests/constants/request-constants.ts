export const REQUEST_TYPES = [
    { value: "VACATION", label: "Vacation" },
    { value: "SICK_LEAVE", label: "Sick Leave" },
    { value: "WORK_FROM_HOME", label: "Work From Home" },
    { value: "OTHER", label: "Other" },
] as const

export const REQUEST_TYPE_LABELS: Record<string, string> = {
    VACATION: "Vacation",
    SICK_LEAVE: "Sick Leave",
    WORK_FROM_HOME: "Work From Home",
    OTHER: "Other",
}

import { getRequestStatusColor, type RequestStatus } from "@/lib/work-type-styles"

export const REQUEST_STATUS_COLORS: Record<RequestStatus, string> = {
    PENDING: getRequestStatusColor("PENDING"),
    APPROVED: getRequestStatusColor("APPROVED"),
    REJECTED: getRequestStatusColor("REJECTED"),
    CANCELLED: getRequestStatusColor("CANCELLED"),
}

export const REQUEST_STATUS = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    CANCELLED: "CANCELLED",
} as const

export const REQUEST_TYPE = {
    VACATION: "VACATION",
    SICK_LEAVE: "SICK_LEAVE",
    WORK_FROM_HOME: "WORK_FROM_HOME",
    OTHER: "OTHER",
} as const
