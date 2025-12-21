"use client"

import { useQuery } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTimeSheetsStore } from "../stores/time-sheets-store"
import { getDateRangeForView, countWorkingDays } from "../utils/date-helpers"
import { aggregateTimeEntriesByTaskAndDate } from "../utils/aggregation-helpers"
import { getTimeSheetEntries } from "../actions/time-sheet-actions"
import { timeSheetKeys } from "../query-keys"
import { TimeSheetsTable } from "./time-sheets-table"
import { TimeSheetsSummary } from "./time-sheets-summary"

interface TimeSheetsClientProps {
    translations: {
        week: string
        month: string
        task: string
        noData: string
        loading: string
        error: string
        workingDays: string
        expected: string
        total: string
        overtime: string
    }
}

export function TimeSheetsClient({ translations }: TimeSheetsClientProps) {
    const viewMode = useTimeSheetsStore((state) => state.viewMode)
    const selectedDate = useTimeSheetsStore((state) => state.selectedDate)
    const setViewMode = useTimeSheetsStore((state) => state.setViewMode)
    const goToPreviousPeriod = useTimeSheetsStore((state) => state.goToPreviousPeriod)
    const goToNextPeriod = useTimeSheetsStore((state) => state.goToNextPeriod)

    const dateRange = getDateRangeForView(selectedDate, viewMode)

    const { data, isLoading, error } = useQuery({
        queryKey: timeSheetKeys.list({
            startDate: dateRange.startDate.toISOString(),
            endDate: dateRange.endDate.toISOString(),
        }),
        queryFn: async () => {
            const result = await getTimeSheetEntries({
                startDate: dateRange.startDate.toISOString(),
                endDate: dateRange.endDate.toISOString(),
            })

            if ("error" in result) {
                throw new Error(result.error)
            }

            return result.data
        },
    })

    const aggregatedData = data
        ? aggregateTimeEntriesByTaskAndDate(data, dateRange.dates)
        : { tasks: new Map(), dates: dateRange.dates.map((d) => d.toISOString().split("T")[0]) }

    const totalSeconds = Array.from(aggregatedData.tasks.values()).reduce(
        (sum, task) => sum + task.totalDuration,
        0
    )

    const workingDays = countWorkingDays(dateRange.dates)

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={goToPreviousPeriod}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-[200px] text-center font-semibold">{dateRange.title}</div>
                    <Button variant="outline" size="icon" onClick={goToNextPeriod}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant={viewMode === "week" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("week")}
                    >
                        {translations.week}
                    </Button>
                    <Button
                        variant={viewMode === "month" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("month")}
                    >
                        {translations.month}
                    </Button>
                </div>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                    {translations.loading}
                </div>
            )}

            {error && (
                <div className="flex items-center justify-center h-64 text-destructive">
                    {translations.error}
                </div>
            )}

            {!isLoading && !error && (
                <>
                    <TimeSheetsSummary
                        totalSeconds={totalSeconds}
                        workingDays={workingDays}
                        translations={{
                            workingDays: translations.workingDays,
                            expected: translations.expected,
                            total: translations.total,
                            overtime: translations.overtime,
                        }}
                    />
                    <div className="flex-1 overflow-hidden">
                        <TimeSheetsTable
                            aggregatedData={aggregatedData}
                            translations={{
                                task: translations.task,
                                noData: translations.noData,
                            }}
                        />
                    </div>
                </>
            )}
        </div>
    )
}
