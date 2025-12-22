"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTimeSheetsStore } from "../stores/time-sheets-store"
import { getDateRangeForView, type ViewMode } from "../utils/date-helpers"
import { aggregateTimeEntriesByTaskAndDate } from "../utils/aggregation-helpers"
import { getTimeSheetEntries } from "../actions/time-sheet-actions"
import { timeSheetKeys } from "../query-keys"
import { TimeSheetsTable } from "./time-sheets-table"
import type { TimeEntryWithTask } from "../utils/aggregation-helpers"

interface TimeSheetsClientProps {
    initialData: TimeEntryWithTask[]
    initialViewMode: ViewMode
    initialSelectedDate: Date
    translations: {
        week: string
        month: string
        task: string
        total: string
        noData: string
        loading: string
        error: string
    }
}

export function TimeSheetsClient({
    initialData,
    initialViewMode,
    initialSelectedDate,
    translations,
}: TimeSheetsClientProps) {
    const router = useRouter()
    const viewMode = useTimeSheetsStore((state) => state.viewMode)
    const selectedDate = useTimeSheetsStore((state) => state.selectedDate)
    const setViewMode = useTimeSheetsStore((state) => state.setViewMode)
    const setSelectedDate = useTimeSheetsStore((state) => state.setSelectedDate)
    const goToPreviousPeriod = useTimeSheetsStore((state) => state.goToPreviousPeriod)
    const goToNextPeriod = useTimeSheetsStore((state) => state.goToNextPeriod)

    useEffect(() => {
        setViewMode(initialViewMode)
        setSelectedDate(initialSelectedDate)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const params = new URLSearchParams()
        params.set("mode", viewMode)
        params.set("date", selectedDate.toISOString().split("T")[0])
        router.replace(`?${params.toString()}`, { scroll: false })
    }, [viewMode, selectedDate, router])

    const dateRange = getDateRangeForView(selectedDate, viewMode)

    const formatHoursMinutes = (seconds: number): string => {
        const totalHours = seconds / 3600
        const h = Math.floor(totalHours)
        const m = Math.round((totalHours - h) * 60)
        if (m === 0) return `${h}h`
        return `${h}h ${m}m`
    }

    const {
        data = initialData,
        isLoading,
        error,
    } = useQuery({
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

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={goToPreviousPeriod}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-center font-semibold whitespace-nowrap">
                            {dateRange.title}
                        </div>
                        <Button variant="outline" size="icon" onClick={goToNextPeriod}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-sm hidden lg:block">
                            <span className="text-muted-foreground">{translations.total}: </span>
                            <span
                                className={`font-semibold ${
                                    viewMode === "week" && totalSeconds / 3600 > 40
                                        ? "text-red-600 dark:text-red-500"
                                        : ""
                                }`}
                            >
                                {formatHoursMinutes(totalSeconds)}
                            </span>
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
                </div>

                <div className="text-sm text-center lg:hidden">
                    <span className="text-muted-foreground">{translations.total}: </span>
                    <span
                        className={`font-semibold ${
                            viewMode === "week" && totalSeconds / 3600 > 40
                                ? "text-red-600 dark:text-red-500"
                                : ""
                        }`}
                    >
                        {formatHoursMinutes(totalSeconds)}
                    </span>
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
                <div className="flex-1 overflow-hidden">
                    <TimeSheetsTable
                        aggregatedData={aggregatedData}
                        translations={{
                            task: translations.task,
                            noData: translations.noData,
                        }}
                    />
                </div>
            )}
        </div>
    )
}
