import type { TaskTimeEntry, Task, List } from "../../../../../prisma/generated/client"

export type TimeEntryWithTask = TaskTimeEntry & {
    task: Task & {
        list: List | null
    }
}

export interface TaskDateEntry {
    taskId: string
    taskTitle: string
    listName: string
    durationInSeconds: number
}

export interface AggregatedTimeSheet {
    tasks: Map<
        string,
        {
            taskId: string
            taskTitle: string
            listName: string
            byDate: Map<string, number>
            totalDuration: number
        }
    >
    dates: string[]
}

export function aggregateTimeEntriesByTaskAndDate(
    entries: TimeEntryWithTask[],
    allDates: Date[]
): AggregatedTimeSheet {
    const tasks = new Map<
        string,
        {
            taskId: string
            taskTitle: string
            listName: string
            byDate: Map<string, number>
            totalDuration: number
        }
    >()

    const dateStrings = allDates.map((date) => normalizeToDateString(date))

    for (const entry of entries) {
        if (!entry.duration) continue

        const dateKey = normalizeToDateString(entry.startTime)

        if (!tasks.has(entry.taskId)) {
            tasks.set(entry.taskId, {
                taskId: entry.taskId,
                taskTitle: entry.task.title,
                listName: entry.task.list?.name ?? "No List",
                byDate: new Map(),
                totalDuration: 0,
            })
        }

        const taskData = tasks.get(entry.taskId)!
        const currentDuration = taskData.byDate.get(dateKey) ?? 0
        taskData.byDate.set(dateKey, currentDuration + entry.duration)
        taskData.totalDuration += entry.duration
    }

    return {
        tasks,
        dates: dateStrings,
    }
}

export function normalizeToDateString(date: Date): string {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}
