import { getTasks } from "@/app/(protected)/tasks/actions/task-actions"
import {
    getActiveTrackingEntry,
    getGeneralWorkTask,
    getTrackerPreferences,
    getTaskTimeEntries,
} from "./actions/tracker-actions"
import { TASK_STATUS } from "@/app/(protected)/tasks/constants/task-statuses"
import { TrackerDisplay } from "./components/tracker-display"
import { TimeEntriesDialog } from "@/app/(protected)/tasks/components/time-entries-dialog"
import { getTranslations } from "next-intl/server"

export default async function TrackerPage() {
    const t = await getTranslations("tasks.tracker")
    const tTypes = await getTranslations("hours.types")

    const [inProgressTasks, activeTimer, generalWorkTask, trackerPreferences] = await Promise.all([
        getTasks({ status: TASK_STATUS.IN_PROGRESS }),
        getActiveTrackingEntry(),
        getGeneralWorkTask(),
        getTrackerPreferences(),
    ])

    const initialTaskEntries = await getTaskTimeEntries(
        trackerPreferences.selectedTaskId ?? undefined
    )

    const translations = {
        selectType: t("selectType"),
        selectTask: t("selectTask"),
        trackingType: t("trackingType"),
        todayEntries: t("todayEntries"),
        work: tTypes("work"),
        break: tTypes("break"),
        private: tTypes("private"),
        noTasksAvailable: t("noTasksAvailable"),
        generalWork: "General",
    }

    return (
        <div className="space-y-6">
            <TrackerDisplay
                inProgressTasks={inProgressTasks}
                generalWorkTask={generalWorkTask}
                initialSelectedType={trackerPreferences.selectedType}
                initialSelectedTaskId={trackerPreferences.selectedTaskId}
                initialActiveTimer={activeTimer}
                initialTodayEntries={initialTaskEntries}
                translations={translations}
            />
            <TimeEntriesDialog />
        </div>
    )
}
