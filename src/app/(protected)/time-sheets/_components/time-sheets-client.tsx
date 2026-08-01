"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Download, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTimeSheetsStore } from "../_stores/time-sheets-store"
import { useTasksStore } from "@/app/(protected)/tasks/_stores/tasks-store"
import { getDateRangeForView, type ViewMode } from "../_utils/date-helpers"
import { aggregateTimeEntriesByTaskAndDate } from "../_utils/aggregation-helpers"
import { exportTimeSheetData } from "../_actions/export-actions"
import { ExportDialog, type ExportFormat } from "@/features/export"
import { TimeSheetsTable } from "./time-sheets-table"
import type { TimeEntryDisplay } from "../_schemas/time-sheet-schemas"
import { useTranslations } from "next-intl"
import { useTimeSheetsSSE } from "../_hooks/use-time-sheets-sse"
import { useTimeSheetsPusher } from "../_hooks/use-time-sheets-pusher"
import { formatHoursMinutes as formatHoursMinutesFromHours } from "@/app/(protected)/hours/_utils/time-helpers"
import {
    calculateExpectedHoursToDate,
    calculateBalance,
    formatBalance,
    formatHoursMinutes as formatHoursMinutesLib,
    getBalanceColor,
} from "@/lib/balance-helpers"

interface TimeSheetsClientProps {
    initialData: TimeEntryDisplay[]
    initialViewMode: ViewMode
    initialSelectedDate: Date
    initialTaskFilter: "work" | "private"
    initialHolidays?: Array<{ date: Date; name: string }>
    userWorkHoursPerDay: number
    initialBalance: number
    initialExpectedHours: number
    translations: {
        week: string
        month: string
        viewLabel: string
        filterWork: string
        filterPrivate: string
        filterLabel: string
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
    initialTaskFilter,
    initialHolidays = [],
    userWorkHoursPerDay,
    initialBalance,
    initialExpectedHours,
    translations,
}: TimeSheetsClientProps) {
    const tCommon = useTranslations("common")
    useTimeSheetsSSE()
    useTimeSheetsPusher()
    const router = useRouter()
    const storeViewMode = useTimeSheetsStore((state) => state.viewMode)
    const storeSelectedDate = useTimeSheetsStore((state) => state.selectedDate)
    const storeTaskFilter = useTimeSheetsStore((state) => state.taskFilter)
    const setViewMode = useTimeSheetsStore((state) => state.setViewMode)
    const setSelectedDate = useTimeSheetsStore((state) => state.setSelectedDate)
    const setTaskFilter = useTimeSheetsStore((state) => state.setTaskFilter)
    const goToPreviousPeriod = useTimeSheetsStore((state) => state.goToPreviousPeriod)
    const goToNextPeriod = useTimeSheetsStore((state) => state.goToNextPeriod)
    const goToToday = useTimeSheetsStore((state) => state.goToToday)

    const activeTimer = useTasksStore((state) => state.activeTimer)
    const setActiveTimer = useTasksStore((state) => state.setActiveTimer)
    const clearActiveTimer = useTasksStore((state) => state.clearActiveTimer)

    const [isInitialized, setIsInitialized] = useState(false)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)

    useEffect(() => {
        setViewMode(initialViewMode)
        setSelectedDate(initialSelectedDate)
        setTaskFilter(initialTaskFilter)
        setIsInitialized(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const viewMode = isInitialized ? storeViewMode : initialViewMode
    const selectedDate = isInitialized ? storeSelectedDate : initialSelectedDate
    const taskFilter = isInitialized ? storeTaskFilter : initialTaskFilter

    useEffect(() => {
        const params = new URLSearchParams()
        params.set("mode", viewMode)
        params.set("date", selectedDate.toISOString().split("T")[0])
        if (taskFilter === "private") {
            params.set("filter", "private")
        }

        router.replace(`?${params.toString()}`, { scroll: false })
    }, [viewMode, selectedDate, taskFilter, router])

    const dateRange = getDateRangeForView(initialSelectedDate, initialViewMode)

    const formatHoursMinutes = (seconds: number): string => {
        const totalHours = seconds / 3600
        return formatHoursMinutesFromHours(totalHours)
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
            const entryStartTime = new Date(activeEntry.startTime)
            if (
                !activeTimer ||
                activeTimer.taskId !== activeEntry.taskId ||
                activeTimer.entryId !== activeEntry.id ||
                activeTimer.startTime.getTime() !== entryStartTime.getTime()
            ) {
                clearActiveTimer()
                setActiveTimer(activeEntry.taskId, activeEntry.id, entryStartTime)
            }
        } else if (activeTimer) {
            clearActiveTimer()
        }
    }, [data, activeTimer, setActiveTimer, clearActiveTimer])

    const aggregatedData = useMemo(
        () =>
            data
                ? aggregateTimeEntriesByTaskAndDate(data, dateRange.dates, currentTime)
                : {
                      tasks: new Map(),
                      dates: dateRange.dates.map((d) => d.toISOString().split("T")[0]),
                      dailyTotals: new Map(),
                  },
        [data, dateRange.dates, currentTime]
    )

    const totalSeconds = Array.from(aggregatedData.dailyTotals.values()).reduce(
        (sum, daily) => sum + daily,
        0
    )

    const hasActiveTimer = useMemo(() => data.some((entry) => entry.endTime === null), [data])

    const expectedHours = useMemo(() => {
        if (!hasActiveTimer) return initialExpectedHours
        return calculateExpectedHoursToDate(
            dateRange.startDate,
            dateRange.endDate,
            initialHolidays,
            userWorkHoursPerDay
        )
    }, [hasActiveTimer, initialExpectedHours, dateRange, initialHolidays, userWorkHoursPerDay])

    const balance = useMemo(() => {
        if (!hasActiveTimer) return initialBalance
        return calculateBalance(totalSeconds, expectedHours)
    }, [hasActiveTimer, initialBalance, totalSeconds, expectedHours])

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
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs px-2"
                            onClick={goToToday}
                        >
                            {tCommon("time.today")}
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div
                            id="time-sheets-balance"
                            className="text-sm flex flex-col sm:flex-row sm:items-center sm:gap-1 items-end"
                        >
                            <span className="font-semibold">
                                {formatHoursMinutesLib(totalSeconds)}
                            </span>
                            {taskFilter === "work" && (
                                <>
                                    <span className="text-muted-foreground max-sm:hidden"> | </span>
                                    <span className={`font-semibold ${getBalanceColor(balance)}`}>
                                        {formatBalance(balance)}
                                    </span>
                                </>
                            )}
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>{translations.filterLabel}</DropdownMenuLabel>
                                <DropdownMenuRadioGroup
                                    value={taskFilter}
                                    onValueChange={(v) => setTaskFilter(v as "work" | "private")}
                                >
                                    <DropdownMenuRadioItem value="work">
                                        {translations.filterWork}
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="private">
                                        {translations.filterPrivate}
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>{translations.viewLabel}</DropdownMenuLabel>
                                <DropdownMenuRadioGroup
                                    value={viewMode}
                                    onValueChange={(v) => setViewMode(v as ViewMode)}
                                >
                                    <DropdownMenuRadioItem value="week">
                                        {translations.week}
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="month">
                                        {translations.month}
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                                {taskFilter === "work" && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => setIsExportDialogOpen(true)}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            {tCommon("actions.export")}
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <TimeSheetsTable
                    aggregatedData={aggregatedData}
                    isLoading={isLoading}
                    error={error ? translations.error : null}
                    currentTime={currentTime}
                    formatHoursMinutes={formatHoursMinutes}
                    holidays={initialHolidays}
                    userWorkHoursPerDay={userWorkHoursPerDay}
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
