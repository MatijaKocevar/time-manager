"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import type { HourEntryDisplay } from "../schemas/hour-entry-schemas"
import type { ViewMode } from "../schemas/hour-filter-schemas"
import { HOUR_TYPES, HOUR_TYPE_COLORS, TASK_ID_VALUES } from "../constants/hour-types"
import { VIEW_MODE_VALUES } from "../schemas/hour-filter-schemas"
import { getHourTypeTranslationKey } from "../utils/translation-helpers"
import { formatHoursMinutes } from "../utils/time-helpers"
import { calculateWorkingDaysSync, calculateOvertime } from "../utils/calculation-helpers"
import {
    calculateExpectedHoursToDate,
    formatBalance as formatBalanceLib,
} from "@/lib/balance-helpers"
import { getCurrentUser } from "../../profile/actions/profile-actions"

interface HoursSummaryProps {
    entries: HourEntryDisplay[]
    isLoading?: boolean
    viewMode: ViewMode
    weeklyEntries: HourEntryDisplay[]
    monthlyEntries: HourEntryDisplay[]
    dateRange?: { start: Date; end: Date }
    holidays?: Array<{ date: Date }>
    initialAttendanceData?: { officeCount: number; remoteCount: number }
    userData?: { workHoursPerDay: number }
    onHourTypeClick?: (type: string) => void
}

export function HoursSummary({
    weeklyEntries,
    monthlyEntries,
    viewMode,
    dateRange,
    holidays = [],
    initialAttendanceData,
    userData: userDataProp,
    onHourTypeClick,
}: HoursSummaryProps) {
    const t = useTranslations("hours.summary")
    const tCommon = useTranslations("common")
    const tTypes = useTranslations("hours.types")

    const { data: userData } = useQuery({
        queryKey: ["user-profile"],
        queryFn: () => getCurrentUser(),
        enabled: !userDataProp,
    })

    const attendanceData = initialAttendanceData

    const hoursPerDay = userDataProp?.workHoursPerDay || userData?.workHoursPerDay || 8

    const weeklyGrandTotal = weeklyEntries
        .filter((entry) => entry.taskId === TASK_ID_VALUES.TOTAL)
        .reduce((sum, entry) => sum + entry.hours, 0)

    const monthlyGrandTotal = monthlyEntries
        .filter((entry) => entry.taskId === TASK_ID_VALUES.TOTAL)
        .reduce((sum, entry) => sum + entry.hours, 0)

    let expectedHours = 0
    let overtime = 0
    let workingDays = 0

    const actualDaysWorked = useMemo(() => {
        const uniqueDates = new Set<string>()
        monthlyEntries
            .filter((entry) => entry.taskId === TASK_ID_VALUES.TOTAL && entry.hours > 0)
            .forEach((entry) => {
                const dateKey = entry.date.toISOString().split("T")[0]
                uniqueDates.add(dateKey)
            })
        return uniqueDates.size
    }, [monthlyEntries])

    if (dateRange) {
        workingDays = calculateWorkingDaysSync(dateRange.start, dateRange.end, holidays)
        const expectedForPeriod = calculateExpectedHoursToDate(
            dateRange.start,
            dateRange.end,
            holidays,
            hoursPerDay
        )
        expectedHours = expectedForPeriod

        if (viewMode === VIEW_MODE_VALUES.WEEKLY) {
            overtime = weeklyGrandTotal - expectedHours
        } else {
            overtime = monthlyGrandTotal - expectedHours
        }
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
    const showBalance = dateRange && workingDays > 0

    return (
        <Card>
            <CardContent className="p-2">
                <div
                    className={`grid grid-cols-1 gap-2 w-full ${showWeekly ? "lg:grid-cols-[max-content_1fr]" : "lg:grid-cols-2"}`}
                >
                    <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col gap-1">
                            <div
                                className={`px-1.5 py-0.5 rounded text-xs font-medium w-fit ${HOUR_TYPE_COLORS.GRAND_TOTAL}`}
                            >
                                {t("totalHours")}
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold">
                                    {showWeekly
                                        ? formatHoursMinutes(weeklyGrandTotal)
                                        : formatHoursMinutes(monthlyGrandTotal)}
                                </span>
                                {showBalance && (
                                    <>
                                        <span className="text-muted-foreground text-sm">|</span>
                                        <span
                                            className={`text-sm font-bold ${
                                                Math.abs(overtime) < 0.25
                                                    ? "text-green-600 dark:text-green-500"
                                                    : overtime > 0
                                                      ? "text-red-600 dark:text-red-500"
                                                      : "text-orange-600 dark:text-orange-500"
                                            }`}
                                        >
                                            {formatBalanceLib(overtime)}
                                        </span>
                                    </>
                                )}
                            </div>
                            {showWeekly && (
                                <span className="text-xs text-muted-foreground">
                                    {formatHoursMinutes(monthlyGrandTotal)} {tCommon("time.month")}
                                </span>
                            )}
                        </div>
                        {viewMode === VIEW_MODE_VALUES.MONTHLY && showBalance && (
                            <>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground">
                                        {t("expected")}
                                    </span>
                                    <span className="font-semibold">
                                        {formatHoursMinutes(expectedHours)}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground">
                                        {t("workingDays")}
                                    </span>
                                    <span className="font-semibold">
                                        {workingDays} / {actualDaysWorked}
                                    </span>
                                </div>
                            </>
                        )}
                        {viewMode === VIEW_MODE_VALUES.MONTHLY && attendanceData && (
                            <>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground">
                                        {t("inOffice")}
                                    </span>
                                    <span className="font-semibold">
                                        {attendanceData.officeCount}x
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground">
                                        {t("workFromHome")}
                                    </span>
                                    <span className="font-semibold">
                                        {attendanceData.remoteCount}x
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {HOUR_TYPES.map((hourType) => (
                            <div
                                key={hourType.value}
                                className={`flex flex-col gap-0.5 ${onHourTypeClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                                onClick={() => onHourTypeClick?.(hourType.value)}
                            >
                                <div
                                    className={`px-1.5 py-0.5 rounded text-xs font-medium ${HOUR_TYPE_COLORS[hourType.value]}`}
                                >
                                    {tTypes(getHourTypeTranslationKey(hourType.value))}
                                </div>
                                {showWeekly ? (
                                    <div className="flex items-center gap-1">
                                        <span className="font-semibold">
                                            {formatHoursMinutes(weeklyHoursByType[hourType.value])}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            /{" "}
                                            {formatHoursMinutes(monthlyHoursByType[hourType.value])}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="font-semibold">
                                        {formatHoursMinutes(monthlyHoursByType[hourType.value])}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
