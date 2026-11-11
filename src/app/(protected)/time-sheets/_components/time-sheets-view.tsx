import { getTranslations } from "next-intl/server"
import { TimeSheetsClient } from "./time-sheets-client"
import { TimeEntriesDialog } from "@/app/(protected)/tasks/_components/time-entries-dialog"
import { DayEntriesDialog } from "./day-entries-dialog"
import { TaskDescriptionDialog } from "@/app/(protected)/tasks/_components/task-description-dialog"
import { getTimeSheetEntries } from "../_actions/time-sheet-actions"
import { getDateRangeForView, type ViewMode } from "../_utils/date-helpers"
import { getCurrentUser } from "@/app/(protected)/profile/_actions/profile-actions"
import { aggregateTimeEntriesByTaskAndDate } from "../_utils/aggregation-helpers"
import { calculateExpectedHoursToDate, calculateBalance } from "@/lib/balance-helpers"
import { getTutorialsSeen, PageTour } from "@/features/tutorial"
import { TIME_SHEET_TASK_FILTERS, type TimeSheetTaskFilter } from "../_schemas/time-sheet-schemas"

interface TimeSheetsViewProps {
    searchParams: { mode?: string; date?: string; filter?: string }
    initialHolidays?: Array<{ date: Date; name: string }>
}

export async function TimeSheetsView({ searchParams, initialHolidays = [] }: TimeSheetsViewProps) {
    const t = await getTranslations("timeSheets")
    const tSummary = await getTranslations("hours.summary")
    const tDialog = await getTranslations("timeSheets.dayEntriesDialog")
    const tTutorial = await getTranslations("tutorial")
    const tTimeSheetsToure = await getTranslations("tutorial.timeSheets")

    const viewMode = (searchParams.mode === "month" ? "month" : "week") as ViewMode
    const selectedDate = searchParams.date ? new Date(searchParams.date) : new Date()
    const taskFilter = (TIME_SHEET_TASK_FILTERS as readonly string[]).includes(
        searchParams.filter ?? ""
    )
        ? (searchParams.filter as TimeSheetTaskFilter)
        : "all"

    const dateRange = getDateRangeForView(selectedDate, viewMode)
    const [result, currentUser, tutorialsSeen] = await Promise.all([
        getTimeSheetEntries({
            startDate: dateRange.startDate.toISOString(),
            endDate: dateRange.endDate.toISOString(),
            taskFilter,
        }),
        getCurrentUser(),
        getTutorialsSeen(),
    ])

    const initialData = "data" in result && result.data ? result.data : []

    const userWorkHoursPerDay = currentUser?.workHoursPerDay || 8

    const aggregatedData = aggregateTimeEntriesByTaskAndDate(
        initialData,
        dateRange.dates,
        new Date()
    )
    const totalSeconds = Array.from(aggregatedData.dailyTotals.values()).reduce(
        (sum, daily) => sum + daily,
        0
    )

    const overtimeUseSeconds = initialData
        .filter((entry) => entry.type === "OVERTIME_USE")
        .reduce((sum, entry) => sum + (entry.duration ?? 0), 0)

    const expectedHours =
        taskFilter === "work"
            ? calculateExpectedHoursToDate(
                  dateRange.startDate,
                  dateRange.endDate,
                  initialHolidays,
                  userWorkHoursPerDay
              )
            : 0

    const balance =
        taskFilter === "work"
            ? calculateBalance(totalSeconds - overtimeUseSeconds, expectedHours)
            : 0

    return (
        <>
            <PageTour
                pageKey="/time-sheets"
                seenPages={tutorialsSeen}
                nextLabel={tTutorial("next")}
                prevLabel={tTutorial("previous")}
                doneLabel={tTutorial("done")}
                steps={[
                    {
                        element: "#time-sheets-table",
                        title: tTimeSheetsToure("table.title"),
                        description: tTimeSheetsToure("table.description"),
                        side: "bottom",
                    },
                    {
                        element: ".time-sheets-task-cell",
                        title: tTimeSheetsToure("taskCell.title"),
                        description: tTimeSheetsToure("taskCell.description"),
                        side: "top",
                    },
                    {
                        element: ".time-sheets-date-header",
                        title: tTimeSheetsToure("dateCell.title"),
                        description: tTimeSheetsToure("dateCell.description"),
                        side: "bottom",
                    },
                    {
                        element: "#time-sheets-balance",
                        title: tTimeSheetsToure("balance.title"),
                        description: tTimeSheetsToure("balance.description"),
                        side: "bottom",
                    },
                ]}
            />
            <TimeSheetsClient
                initialData={initialData}
                initialViewMode={viewMode}
                initialSelectedDate={selectedDate}
                initialTaskFilter={taskFilter}
                initialHolidays={initialHolidays}
                userWorkHoursPerDay={userWorkHoursPerDay}
                initialBalance={balance}
                initialExpectedHours={expectedHours}
                translations={{
                    week: t("viewMode.week"),
                    month: t("viewMode.month"),
                    viewLabel: t("viewMode.label"),
                    filterWork: t("taskFilter.work"),
                    filterPrivate: t("taskFilter.private"),
                    filterOffHours: t("taskFilter.offHours"),
                    filterAll: t("taskFilter.all"),
                    filterLabel: t("taskFilter.label"),
                    task: t("table.task"),
                    total: tSummary("total"),
                    dailyTotal: t("table.dailyTotal"),
                    overtime: t("table.overtime"),
                    undertime: t("table.undertime"),
                    noData: t("messages.noData"),
                    loading: t("messages.loading"),
                    error: t("messages.error"),
                }}
            />
            <TimeEntriesDialog />
            <TaskDescriptionDialog />
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
        </>
    )
}
