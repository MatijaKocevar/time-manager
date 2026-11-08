import type { TaskStatus } from "../_schemas"

export const STATUS_SECTIONS_COOKIE = "tasks_status_sections"

export const DEFAULT_STATUS_SECTIONS: TaskStatus[] = ["IN_PROGRESS", "TODO"]

function parse(value: string): Record<string, TaskStatus[]> | null {
    try {
        const parsed = JSON.parse(value) as Record<string, TaskStatus[]>
        return parsed && typeof parsed === "object" ? parsed : null
    } catch {
        return null
    }
}

export function parseStatusSectionsCookie(value: string | undefined): Record<string, TaskStatus[]> {
    if (!value) {
        return {}
    }

    const raw = parse(value)

    if (raw) {
        return raw
    }

    try {
        return parse(decodeURIComponent(value)) ?? {}
    } catch {
        return {}
    }
}

export function serializeStatusSections(sections: Map<string, Set<TaskStatus>>): string {
    const record: Record<string, TaskStatus[]> = {}

    for (const [listId, statuses] of sections) {
        record[listId] = Array.from(statuses)
    }

    return encodeURIComponent(JSON.stringify(record))
}
