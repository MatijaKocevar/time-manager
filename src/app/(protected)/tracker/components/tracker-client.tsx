"use client"

import type { HourType } from "@/../../prisma/generated/client"
import { TrackerDisplay } from "./tracker-display"
import { TimeEntriesDialog } from "@/app/(protected)/tasks/components/time-entries-dialog"
import type { TaskDisplay } from "@/app/(protected)/tasks/schemas/task-schemas"

interface TrackerClientProps {
    initialInProgressTasks: TaskDisplay[]
    initialGeneralWorkTask: { id: string; title: string } | null
    initialActiveTimer: {
        id: string
        taskId: string
        userId: string
        startTime: Date
        endTime: Date | null
        duration: number | null
        createdAt: Date
        updatedAt: Date
        type: HourType
        task: {
            id: string
            title: string
            isSystemTask: boolean
        }
    } | null
    translations: {
        selectType: string
        selectTask: string
        trackingType: string
        todayEntries: string
        work: string
        break: string
        private: string
        noTasksAvailable: string
        generalWork: string
    }
}

export function TrackerClient({
    initialInProgressTasks,
    initialGeneralWorkTask,
    initialActiveTimer,
    translations,
}: TrackerClientProps) {
    return (
        <div className="space-y-6">
            <TrackerDisplay
                inProgressTasks={initialInProgressTasks}
                generalWorkTask={initialGeneralWorkTask}
                initialActiveTimer={initialActiveTimer}
                translations={translations}
            />
            <TimeEntriesDialog />
        </div>
    )
}
