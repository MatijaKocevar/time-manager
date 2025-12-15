"use client"

import { useTranslations } from "next-intl"
import { TrackerDisplay } from "./tracker-display"
import { TrackerTasksTable } from "./tracker-tasks-table"
import type { TaskDisplay } from "@/app/(protected)/tasks/schemas/task-schemas"
import type { TaskTimeEntryDisplay } from "@/app/(protected)/tasks/schemas/task-time-entry-schemas"

interface TrackerClientProps {
    initialTasks: TaskDisplay[]
    initialActiveTimer: TaskTimeEntryDisplay | null
}

export function TrackerClient({ initialTasks, initialActiveTimer }: TrackerClientProps) {
    const t = useTranslations("tasks.tracker")

    return (
        <div className=" space-y-6">
            <TrackerDisplay tasks={initialTasks} initialActiveTimer={initialActiveTimer} />
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">{t("selectTaskToTrack")}</h3>
                <TrackerTasksTable tasks={initialTasks} />
            </div>
        </div>
    )
}
