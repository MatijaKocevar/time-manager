import type { TaskStatus } from "../schemas"

export const TASK_STATUS_KEYS: Record<TaskStatus, string> = {
    TODO: "todo",
    IN_PROGRESS: "inProgress",
    ON_HOLD: "onHold",
    DONE: "done",
    CANCELED: "canceled",
}

export function getTaskStatusLabel(t: (key: string) => string, status: TaskStatus): string {
    return t(TASK_STATUS_KEYS[status])
}
