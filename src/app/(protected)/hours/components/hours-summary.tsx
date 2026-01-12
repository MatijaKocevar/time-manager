"use client"

import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader } from "@/components/ui/card"
import type { HourEntryDisplay } from "../schemas/hour-entry-schemas"
import type { ViewMode } from "../schemas/hour-filter-schemas"
import { HOUR_TYPES, HOUR_TYPE_COLORS, TASK_ID_VALUES } from "../constants/hour-types"
import { VIEW_MODE_VALUES } from "../schemas/hour-filter-schemas"
import { getHourTypeTranslationKey } from "../utils/translation-helpers"
import { formatHoursMinutes } from "../utils/time-helpers"
import { calculateWorkingDaysSync, calculateOvertime } from "../utils/calculation-helpers"
import { getCurrentUser } from "../../profile/actions/profile-actions"
import { useHoursStore } from "../stores/hours-store"

interface HoursSummaryProps {
    entries: HourEntryDisplay[]
    isLoading?: boolean
    viewMode: ViewMode
    weeklyEntries: HourEntryDisplay[]
    monthlyEntries: HourEntryDisplay[]
    dateRange?: { start: Date; end: Date }
    holidays?: Array<{ date: Date }>
}

export function HoursSummary({
    weeklyEntries,
    monthlyEntries,
    viewMode,
    dateRange,
    holidays = [],
}: HoursSummaryProps) {
    const t = useTranslations("hours.summary")
    const tCommon = useTranslations("common")
    const tTypes = useTranslations("hours.types")

    const { data: userData } = useQuery({
        queryKey: ["user-profile"],
        queryFn: () => getCurrentUser(),
    })

    const hoursPerDay = userData?.workHoursPerDay || 8

    const weeklyGrandTotal = weeklyEntries
        .filter((entry) => entry.taskId === TASK_ID_VALUES.TOTAL)
        .reduce((sum, entry) => sum + entry.hours, 0)

    const monthlyGrandTotal = monthlyEntries
        .filter((entry) => entry.taskId === TASK_ID_VALUES.TOTAL)
        .reduce((sum, entry) => sum + entry.hours, 0)

    let expectedHours = 0
    let overtime = 0
    let workingDays = 0

    if (viewMode === VIEW_MODE_VALUES.MONTHLY && dateRange) {
        workingDays = calculateWorkingDaysSync(dateRange.start, dateRange.end, holidays)
        expectedHours = workingDays * hoursPerDay
        overtime = calculateOvertime(monthlyGrandTotal, workingDays, hoursPerDay)
    }

    const weeklyTypeTotals = weeklyEntries.filter((entry) => entry.taskId === TASK_ID_VALUES.TOTAL)
    const weeklyHoursByType = HOUR_TYPES.reduce(
        (acc, hourType) => {
            acc[hourType.value] = weeklyTypeTotals
                .filter((entry) => entry.type === hourType.value)
                .reduce((sum, entry) => sum + entry.hours, 0)
            return acc
        },
        {} as Record<string, number>
    )

    const monthlyTypeTotals = monthlyEntries.filter(
        (entry) => entry.taskId === TASK_ID_VALUES.TOTAL
    )
    const monthlyHoursByType = HOUR_TYPES.reduce(
        (acc, hourType) => {
            acc[hourType.value] = monthlyTypeTotals
                .filter((entry) => entry.type === hourType.value)
                .reduce((sum, entry) => sum + entry.hours, 0)
            return acc
        },
        {} as Record<string, number>
    )

    const showWeekly = viewMode === VIEW_MODE_VALUES.WEEKLY
    const showOvertime = viewMode === VIEW_MODE_VALUES.MONTHLY && workingDays > 0
    const summaryCollapsed = useHoursStore((state) => state.summaryCollapsed)
    const toggleSummary = useHoursStore((state) => state.toggleSummary)

    return (
        <div className="space-y-2">
            <Card>
                <CardHeader className="p-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-wrap text-sm">
                            <div className="flex items-center gap-1.5">
                                <div
                                    className={`px-1.5 py-0.5 rounded text-xs font-medium ${HOUR_TYPE_COLORS.GRAND_TOTAL}`}
                                >
                                    {t("totalHours")}
                                </div>
                                <span className="text-lg font-bold">
                                    {showWeekly
                                        ? formatHoursMinutes(weeklyGrandTotal)
                                        : formatHoursMinutes(monthlyGrandTotal)}
                                </span>
                                {showWeekly && (
                                    <span className="text-xs text-muted-foreground">
                                        / {formatHoursMinutes(monthlyGrandTotal)}{" "}
                                        {tCommon("time.month")}
                                    </span>
                                )}
                            </div>
                            {showOvertime && (
                                <>
                                    <div className="h-4 w-px bg-border" />
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-muted-foreground">
                                            {t("expected")}:
                                        </span>
                                        <span className="font-semibold">
                                            {formatHoursMinutes(expectedHours)}
                                        </span>
                                    </div>
                                    <div className="h-4 w-px bg-border" />
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-muted-foreground">
                                            {t("overtime")}:
                                        </span>
                                        <span
                                            className={`font-bold ${
                                                overtime > 0
                                                    ? "text-red-600 dark:text-red-500"
                                                    : overtime < 0
                                                      ? "text-orange-600 dark:text-orange-500"
                                                      : "text-green-600 dark:text-green-500"
                                            }`}
                                        >
                                            {overtime > 0 && "+"}
                                            {formatHoursMinutes(overtime)}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleSummary}
                            className="h-8 px-2"
                        >
                            {summaryCollapsed ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronUp className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </CardHeader>
            </Card>
            {!summaryCollapsed && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                    {HOUR_TYPES.map((hourType) => (
                        <Card key={hourType.value}>
                            <CardHeader className="p-2">
                                <div
                                    className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${HOUR_TYPE_COLORS[hourType.value]}`}
                                >
                                    {tTypes(getHourTypeTranslationKey(hourType.value))}
                                </div>
                                {showWeekly ? (
                                    <div className="mt-1 text-sm">
                                        <div className="font-semibold">
                                            {formatHoursMinutes(weeklyHoursByType[hourType.value])}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {formatHoursMinutes(monthlyHoursByType[hourType.value])}{" "}
                                            {tCommon("time.month")}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-base font-semibold mt-1">
                                        {formatHoursMinutes(monthlyHoursByType[hourType.value])}
                                    </div>
                                )}
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
