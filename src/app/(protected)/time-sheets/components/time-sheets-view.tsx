import { getTranslations } from "next-intl/server"
import { TimeSheetsClient } from "./time-sheets-client"
import { TimeEntriesDialog } from "../../tasks/components/time-entries-dialog"
import { DayEntriesDialog } from "./day-entries-dialog"
import { getTimeSheetEntries } from "../actions/time-sheet-actions"
import { getDateRangeForView, type ViewMode } from "../utils/date-helpers"
import { getCurrentUser } from "../../profile/actions/profile-actions"
import { aggregateTimeEntriesByTaskAndDate } from "../utils/aggregation-helpers"
import { calculateExpectedHoursToDate, calculateBalance } from "@/lib/balance-helpers"
import { getTutorialsSeen, PageTour } from "@/features/tutorial"

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
    const taskFilter = searchParams.filter === "private" ? "private" : "work"

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

    const expectedHours =
        taskFilter === "private"
            ? 0
            : calculateExpectedHoursToDate(
                  dateRange.startDate,
                  dateRange.endDate,
                  initialHolidays,
                  userWorkHoursPerDay
              )

    const balance = taskFilter === "private" ? 0 : calculateBalance(totalSeconds, expectedHours)

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
                    filterWork: t("taskFilter.work"),
                    filterPrivate: t("taskFilter.private"),
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
