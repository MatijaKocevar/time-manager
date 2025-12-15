import type { RequestType } from "@/../../prisma/generated/client"

export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"

export const REQUEST_TYPE_KEYS: Record<RequestType, string> = {
    VACATION: "requests.types.vacation",
    SICK_LEAVE: "requests.types.sickLeave",
    WORK_FROM_HOME: "requests.types.workFromHome",
    OTHER: "requests.types.other",
}

export const REQUEST_STATUS_KEYS: Record<RequestStatus, string> = {
    PENDING: "requests.statuses.pending",
    APPROVED: "requests.statuses.approved",
    REJECTED: "requests.statuses.rejected",
    CANCELLED: "requests.statuses.cancelled",
}

export function getRequestTypeLabel(t: (key: string) => string, type: RequestType): string {
    return t(REQUEST_TYPE_KEYS[type])
}

export function getRequestStatusLabel(t: (key: string) => string, status: RequestStatus): string {
    return t(REQUEST_STATUS_KEYS[status])
}
