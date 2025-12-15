import type { TaskStatus } from "../schemas"

export const TASK_STATUS_KEYS: Record<TaskStatus, string> = {
    TODO: "tasks.statuses.todo",
    IN_PROGRESS: "tasks.statuses.inProgress",
    ON_HOLD: "tasks.statuses.onHold",
    DONE: "tasks.statuses.done",
    CANCELED: "tasks.statuses.canceled",
}

export function getTaskStatusLabel(t: (key: string) => string, status: TaskStatus): string {
    return t(TASK_STATUS_KEYS[status])
}
