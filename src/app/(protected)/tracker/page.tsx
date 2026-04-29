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
import { getTutorialsSeen, PageTour } from "@/features/tutorial"

export default async function TrackerPage() {
    const t = await getTranslations("tasks.tracker")
    const tTypes = await getTranslations("hours.types")
    const tDialog = await getTranslations("timeSheets.dayEntriesDialog")
    const tClock = await getTranslations("clock")
    const tCommon = await getTranslations("common")
    const tTutorial = await getTranslations("tutorial")
    const tTrackerTour = await getTranslations("tutorial.tracker")

    const [
        inProgressTasks,
        activeTimer,
        generalWorkTask,
        trackerPreferences,
        dailySummary,
        tutorialsSeen,
    ] = await Promise.all([
        getTasks({ status: TASK_STATUS.IN_PROGRESS }),
        getActiveTimer(),
        getGeneralWorkTask(),
        getTrackerPreferences(),
        getTodayTimeSummary(),
        getTutorialsSeen(),
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
        workFromHome: tTypes("workFromHome"),
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
        arrivalDialogWorkFromHome: tClock("arrivalDialog.workFromHomeCheckbox"),
        arrivalDialogWorkFromHomeApproved: tClock("arrivalDialog.workFromHomeApproved"),
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <PageTour
                pageKey="/tracker"
                seenPages={tutorialsSeen}
                nextLabel={tTutorial("next")}
                prevLabel={tTutorial("previous")}
                doneLabel={tTutorial("done")}
                steps={[
                    {
                        element: "#tracker-hour-type",
                        title: tTrackerTour("hourType.title"),
                        description: tTrackerTour("hourType.description"),
                        side: "bottom",
                    },
                    {
                        element: "#tracker-task-select",
                        title: tTrackerTour("taskSelect.title"),
                        description: tTrackerTour("taskSelect.description"),
                        side: "bottom",
                    },
                    {
                        element: "#tracker-time-entries",
                        title: tTrackerTour("timeEntries.title"),
                        description: tTrackerTour("timeEntries.description"),
                        side: "bottom",
                    },
                    {
                        element: "#tracker-timer-button",
                        title: tTrackerTour("timerButton.title"),
                        description: tTrackerTour("timerButton.description"),
                        side: "top",
                    },
                    {
                        element: "#tracker-daily-summary",
                        title: tTrackerTour("dailySummary.title"),
                        description: tTrackerTour("dailySummary.description"),
                        side: "left",
                    },
                ]}
            />
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
