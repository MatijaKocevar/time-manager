import type { TaskStatus } from "../schemas"

export const TASK_STATUSES = [
    {
        value: "TODO" as TaskStatus,
        label: "To Do",
        color: "bg-gray-100 text-gray-800 border-gray-300",
    },
    {
        value: "IN_PROGRESS" as TaskStatus,
        label: "In Progress",
        color: "bg-blue-100 text-blue-800 border-blue-300",
    },
    {
        value: "DONE" as TaskStatus,
        label: "Done",
        color: "bg-green-100 text-green-800 border-green-300",
    },
    {
        value: "BLOCKED" as TaskStatus,
        label: "Blocked",
        color: "bg-red-100 text-red-800 border-red-300",
    },
] as const

export function getStatusLabel(status: TaskStatus): string {
    return TASK_STATUSES.find((s) => s.value === status)?.label || status
}

export function getStatusColor(status: TaskStatus): string {
    return TASK_STATUSES.find((s) => s.value === status)?.color || ""
}
