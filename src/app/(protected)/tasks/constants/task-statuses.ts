import type { TaskStatus } from "../schemas"

export const TASK_STATUS = {
    TODO: "TODO",
    IN_PROGRESS: "IN_PROGRESS",
    DONE: "DONE",
    ON_HOLD: "ON_HOLD",
    CANCELED: "CANCELED",
} as const

export const TASK_STATUSES = [
    {
        value: TASK_STATUS.TODO as TaskStatus,
        label: "To Do",
        color: "bg-gray-100 text-gray-800 border-gray-300",
    },
    {
        value: TASK_STATUS.IN_PROGRESS as TaskStatus,
        label: "In Progress",
        color: "bg-blue-100 text-blue-800 border-blue-300",
    },
    {
        value: TASK_STATUS.DONE as TaskStatus,
        label: "Done",
        color: "bg-green-100 text-green-800 border-green-300",
    },
    {
        value: TASK_STATUS.ON_HOLD as TaskStatus,
        label: "On Hold",
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    },
    {
        value: TASK_STATUS.CANCELED as TaskStatus,
        label: "Canceled",
        color: "bg-red-100 text-red-800 border-red-300",
    },
] as const

export function getStatusLabel(status: TaskStatus): string {
    return TASK_STATUSES.find((s) => s.value === status)?.label || status
}

export function getStatusColor(status: TaskStatus): string {
    return TASK_STATUSES.find((s) => s.value === status)?.color || ""
}
