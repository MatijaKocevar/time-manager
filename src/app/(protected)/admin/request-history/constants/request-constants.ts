import { getWorkTypeColor, getRequestStatusColor } from "@/lib/work-type-styles"

export const TYPE_COLORS: Record<string, string> = {
    VACATION: getWorkTypeColor("VACATION", "default"),
    SICK_LEAVE: getWorkTypeColor("SICK_LEAVE", "default"),
    WORK_FROM_HOME: getWorkTypeColor("WORK_FROM_HOME", "default"),
    REMOTE_WORK: getWorkTypeColor("WORK_FROM_HOME", "default"),
    OTHER: getWorkTypeColor("OTHER", "default"),
}

export const STATUS_COLORS: Record<string, string> = {
    APPROVED: getRequestStatusColor("APPROVED"),
    REJECTED: getRequestStatusColor("REJECTED"),
    CANCELLED: getRequestStatusColor("CANCELLED"),
}
