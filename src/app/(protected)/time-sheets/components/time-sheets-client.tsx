"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTimeSheetsStore } from "../stores/time-sheets-store"
import { useTasksStore } from "../../tasks/stores/tasks-store"
import { getDateRangeForView, type ViewMode } from "../utils/date-helpers"
import { aggregateTimeEntriesByTaskAndDate } from "../utils/aggregation-helpers"
import { exportTimeSheetData } from "../actions/export-actions"
import { ExportDialog, type ExportFormat } from "@/features/export"
import { TimeSheetsTable } from "./time-sheets-table"
import type { TimeEntryDisplay } from "../schemas/time-sheet-schemas"
import { useTranslations } from "next-intl"

interface TimeSheetsClientProps {
    initialData: TimeEntryDisplay[]
    initialViewMode: ViewMode
    initialSelectedDate: Date
    translations: {
        week: string
        month: string
        task: string
        total: string
        dailyTotal: string
        overtime: string
        undertime: string
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
    const tCommon = useTranslations("common")
    const router = useRouter()
    const storeViewMode = useTimeSheetsStore((state) => state.viewMode)
    const storeSelectedDate = useTimeSheetsStore((state) => state.selectedDate)
    const setViewMode = useTimeSheetsStore((state) => state.setViewMode)
    const setSelectedDate = useTimeSheetsStore((state) => state.setSelectedDate)
    const goToPreviousPeriod = useTimeSheetsStore((state) => state.goToPreviousPeriod)
    const goToNextPeriod = useTimeSheetsStore((state) => state.goToNextPeriod)

    const activeTimers = useTasksStore((state) => state.activeTimers)
    const setActiveTimer = useTasksStore((state) => state.setActiveTimer)
    const clearAllActiveTimers = useTasksStore((state) => state.clearAllActiveTimers)

    const [isInitialized, setIsInitialized] = useState(false)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)

    useEffect(() => {
        setViewMode(initialViewMode)
        setSelectedDate(initialSelectedDate)
        setIsInitialized(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const viewMode = isInitialized ? storeViewMode : initialViewMode
    const selectedDate = isInitialized ? storeSelectedDate : initialSelectedDate

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

    const data = initialData
    const isLoading = false
    const error = null

    useEffect(() => {
        const hasActiveTimer = data.some((entry) => entry.endTime === null)
        if (!hasActiveTimer) return

        const interval = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)

        return () => clearInterval(interval)
    }, [data])

    useEffect(() => {
        const activeEntry = data.find((entry) => entry.endTime === null)

        if (activeEntry) {
            const currentTimer = activeTimers.get(activeEntry.taskId)
            if (!currentTimer || currentTimer.entryId !== activeEntry.id) {
                clearAllActiveTimers()
                setActiveTimer(activeEntry.taskId, activeEntry.id, activeEntry.startTime)
            }
        } else if (activeTimers.size > 0) {
            clearAllActiveTimers()
        }
    }, [data, activeTimers, setActiveTimer, clearAllActiveTimers])

    const aggregatedData = useMemo(
        () =>
            data
                ? aggregateTimeEntriesByTaskAndDate(data, dateRange.dates, currentTime)
                : {
                      tasks: new Map(),
                      dates: dateRange.dates.map((d) => d.toISOString().split("T")[0]),
                  },
        [data, dateRange.dates, currentTime]
    )

    const totalSeconds = Array.from(aggregatedData.tasks.values()).reduce(
        (sum, task) => sum + task.totalDuration,
        0
    )

    const handleExport = async (format: ExportFormat, months: string[]) => {
        if (!months || months.length === 0) {
            return { error: "No months provided" }
        }
        const startDate = `${months[0]}-01`
        const [endYearStr, endMonthStr] = months[months.length - 1].split("-")
        const endYear = Number(endYearStr)
        const endMonth = Number(endMonthStr)
        const endDateObj = new Date(endYear, endMonth + 1, 0)
        const endDate = endDateObj.toISOString().split("T")[0]

        return await exportTimeSheetData({ format, startDate, endDate })
    }

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
                        <div className="text-sm hidden md:block">
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
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsExportDialogOpen(true)}
                            >
                                <Download className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">
                                    {tCommon("actions.export")}
                                </span>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="text-sm text-center md:hidden">
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

            <div className="flex-1 overflow-hidden">
                <TimeSheetsTable
                    aggregatedData={aggregatedData}
                    isLoading={isLoading}
                    error={error ? translations.error : null}
                    currentTime={currentTime}
                    formatHoursMinutes={formatHoursMinutes}
                    translations={{
                        task: translations.task,
                        total: translations.total,
                        dailyTotal: translations.dailyTotal,
                        overtime: translations.overtime,
                        undertime: translations.undertime,
                        noData: translations.noData,
                    }}
                />
            </div>

            <ExportDialog
                open={isExportDialogOpen}
                onOpenChange={setIsExportDialogOpen}
                defaultMonth={dateRange.startDate.toISOString().slice(0, 7)}
                onExport={handleExport}
                filenamePrefix="timesheets"
            />
        </div>
    )
}
