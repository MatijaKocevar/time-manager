import { getTasks } from "@/app/(protected)/tasks/actions/task-actions"
import { getActiveTimer } from "@/app/(protected)/shared/actions/timer-actions"
import {
    getGeneralWorkTask,
    getTrackerPreferences,
    getTaskTimeEntries,
    getSystemTaskByType,
    getTodayTimeSummary,
} from "./actions/tracker-actions"
import { TASK_STATUS } from "@/app/(protected)/tasks/constants/task-statuses"
import { TrackerDisplay } from "./components/tracker-display"
import { TimeEntriesDialog } from "@/app/(protected)/tasks/components/time-entries-dialog"
import { DayEntriesDialog } from "@/app/(protected)/time-sheets/components/day-entries-dialog"
import { getTranslations } from "next-intl/server"

export default async function TrackerPage() {
    const t = await getTranslations("tasks.tracker")
    const tTypes = await getTranslations("hours.types")
    const tDialog = await getTranslations("timeSheets.dayEntriesDialog")
    const tClock = await getTranslations("clock")
    const tCommon = await getTranslations("common")

    const [inProgressTasks, activeTimer, generalWorkTask, trackerPreferences, dailySummary] =
        await Promise.all([
            getTasks({ status: TASK_STATUS.IN_PROGRESS }),
            getActiveTimer(),
            getGeneralWorkTask(),
            getTrackerPreferences(),
            getTodayTimeSummary(),
        ])

    let finalSelectedTaskId = trackerPreferences.selectedTaskId

    if (
        trackerPreferences.selectedType === "BREAK" ||
        trackerPreferences.selectedType === "PRIVATE"
    ) {
        const systemTask = await getSystemTaskByType(trackerPreferences.selectedType)
        finalSelectedTaskId = systemTask?.id ?? null
    }

    const initialTaskEntries = await getTaskTimeEntries(finalSelectedTaskId ?? undefined)

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
        dailySummaryTitle: t("dailySummaryTitle"),
        arrivalDialogTitle: tClock("arrivalDialog.title"),
        arrivalDialogMessage: tClock("arrivalDialog.message"),
        arrivalDialogYes: tClock("arrivalDialog.yesButton"),
        arrivalDialogNo: tClock("arrivalDialog.noButton"),
        arrivalDialogSuccess: tClock("arrivalDialog.successMessage"),
        errorTitle: tCommon("messages.error"),
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-auto">
                <TrackerDisplay
                    inProgressTasks={inProgressTasks}
                    generalWorkTask={generalWorkTask}
                    initialSelectedType={trackerPreferences.selectedType}
                    initialSelectedTaskId={finalSelectedTaskId}
                    initialActiveTimer={activeTimer}
                    initialTodayEntries={initialTaskEntries}
                    initialDailySummary={dailySummary}
                    translations={translations}
                />
            </div>
            <DayEntriesDialog
                translations={{
                    title: tDialog("title"),
                    description: tDialog("description"),
                    startedAt: tDialog("startedAt"),
                    endedAt: tDialog("endedAt"),
                    duration: tDialog("duration"),
                    task: tDialog("task"),
                    active: tDialog("active"),
                    noEntries: tDialog("noEntries"),
                    close: tDialog("close"),
                }}
            />
            <TimeEntriesDialog />
        </div>
    )
}
