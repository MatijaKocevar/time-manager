import type { RequestType, RequestStatus } from "../schemas/request-schemas"

export type RequestTypeTranslationKey = "vacation" | "sickLeave" | "workFromHome" | "other"
export type RequestStatusTranslationKey = "pending" | "approved" | "rejected" | "cancelled"

const REQUEST_TYPE_TO_TRANSLATION_KEY: Record<RequestType, RequestTypeTranslationKey> = {
    VACATION: "vacation",
    SICK_LEAVE: "sickLeave",
    WORK_FROM_HOME: "workFromHome",
    OTHER: "other",
}

const REQUEST_STATUS_TO_TRANSLATION_KEY: Record<RequestStatus, RequestStatusTranslationKey> = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
    CANCELLED: "cancelled",
}

export function getRequestTypeTranslationKey(type: RequestType): RequestTypeTranslationKey {
    return REQUEST_TYPE_TO_TRANSLATION_KEY[type] ?? "other"
}

export function getRequestStatusTranslationKey(status: RequestStatus): RequestStatusTranslationKey {
    return REQUEST_STATUS_TO_TRANSLATION_KEY[status] ?? "pending"
}
