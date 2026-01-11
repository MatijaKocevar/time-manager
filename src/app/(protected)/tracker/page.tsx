import { getTasks } from "@/app/(protected)/tasks/actions/task-actions"
import { getActiveTrackingEntry, getGeneralWorkTask } from "./actions/tracker-actions"
import { TASK_STATUS } from "@/app/(protected)/tasks/constants/task-statuses"
import { TrackerClient } from "./components/tracker-client"
import { getTranslations } from "next-intl/server"

export default async function TrackerPage() {
    const t = await getTranslations("tasks.tracker")
    const tTypes = await getTranslations("hours.types")

    const [inProgressTasks, activeTimer, generalWorkTask] = await Promise.all([
        getTasks({ status: TASK_STATUS.IN_PROGRESS }),
        getActiveTrackingEntry(),
        getGeneralWorkTask(),
    ])

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
        <TrackerClient
            initialInProgressTasks={inProgressTasks}
            initialActiveTimer={activeTimer}
            initialGeneralWorkTask={generalWorkTask}
            translations={translations}
        />
    )
}
