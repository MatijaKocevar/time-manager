"use client"

import { TrackerDisplay } from "./tracker-display"
import { TrackerTasksTable } from "./tracker-tasks-table"
import type { TaskDisplay } from "@/app/(protected)/tasks/schemas/task-schemas"
import type { TaskTimeEntryDisplay } from "@/app/(protected)/tasks/schemas/task-time-entry-schemas"

interface TrackerClientProps {
    initialTasks: TaskDisplay[]
    initialActiveTimer: TaskTimeEntryDisplay | null
}

export function TrackerClient({ initialTasks, initialActiveTimer }: TrackerClientProps) {
    return (
        <div className="container mx-auto p-4 md:p-6 space-y-6">
            <TrackerDisplay tasks={initialTasks} initialActiveTimer={initialActiveTimer} />
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">Select Task to Track</h3>
                <TrackerTasksTable tasks={initialTasks} />
            </div>
        </div>
    )
}
