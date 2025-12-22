"use client"

import { useTranslations } from "next-intl"
import { Card, CardHeader } from "@/components/ui/card"
import type { HourEntryDisplay } from "../schemas/hour-entry-schemas"
import type { ViewMode } from "../schemas/hour-filter-schemas"
import { HOUR_TYPES, HOUR_TYPE_COLORS } from "../constants/hour-types"
import { getHourTypeTranslationKey } from "../utils/translation-helpers"

function formatHoursMinutes(hours: number): string {
    const isNegative = hours < 0
    const absHours = Math.abs(hours)
    const h = Math.floor(absHours)
    const m = Math.round((absHours - h) * 60)
    const sign = isNegative ? "-" : ""
    if (m === 0) return `${sign}${h}h`
    return `${sign}${h}h ${m}m`
}

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
    const weeklyGrandTotal = weeklyEntries
        .filter((entry) => entry.taskId === "total")
        .reduce((sum, entry) => sum + entry.hours, 0)

    const monthlyGrandTotal = monthlyEntries
        .filter((entry) => entry.taskId === "total")
        .reduce((sum, entry) => sum + entry.hours, 0)

    let expectedHours = 0
    let overtime = 0
    let workingDays = 0

    if (viewMode === "MONTHLY" && dateRange) {
        const start = new Date(dateRange.start)
        const end = new Date(dateRange.end)
        const current = new Date(start)

        while (current <= end) {
            const dayOfWeek = current.getDay()
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

            if (!isWeekend) {
                const isHol = holidays.some((h) => {
                    const holidayDate = new Date(h.date)
                    holidayDate.setHours(0, 0, 0, 0)
                    const checkDate = new Date(current)
                    checkDate.setHours(0, 0, 0, 0)
                    return holidayDate.getTime() === checkDate.getTime()
                })

                if (!isHol) {
                    workingDays++
                }
            }

            current.setDate(current.getDate() + 1)
        }

        expectedHours = workingDays * 8
        overtime = monthlyGrandTotal - expectedHours
    }

    const weeklyTypeTotals = weeklyEntries.filter((entry) => entry.taskId === "total")
    const weeklyHoursByType = HOUR_TYPES.reduce(
        (acc, hourType) => {
            acc[hourType.value] = weeklyTypeTotals
                .filter((entry) => entry.type === hourType.value)
                .reduce((sum, entry) => sum + entry.hours, 0)
            return acc
        },
        {} as Record<string, number>
    )

    const monthlyTypeTotals = monthlyEntries.filter((entry) => entry.taskId === "total")
    const monthlyHoursByType = HOUR_TYPES.reduce(
        (acc, hourType) => {
            acc[hourType.value] = monthlyTypeTotals
                .filter((entry) => entry.type === hourType.value)
                .reduce((sum, entry) => sum + entry.hours, 0)
            return acc
        },
        {} as Record<string, number>
    )

    const showWeekly = viewMode === "WEEKLY"
    const showOvertime = viewMode === "MONTHLY" && workingDays > 0

    return (
        <div className="space-y-4">
            {showOvertime && (
                <Card>
                    <CardHeader className="p-4">
                        <div className="flex items-center justify-between gap-6">
                            <div className="flex items-center gap-6 text-sm">
                                <div>
                                    <span className="text-muted-foreground">
                                        {t("workingDays")}:{" "}
                                    </span>
                                    <span className="font-semibold">{workingDays}</span>
                                </div>
                                <div className="h-4 w-px bg-border" />
                                <div>
                                    <span className="text-muted-foreground">{t("expected")}: </span>
                                    <span className="font-semibold">
                                        {formatHoursMinutes(expectedHours)}
                                    </span>
                                </div>
                                <div className="h-4 w-px bg-border" />
                                <div>
                                    <span className="text-muted-foreground">{t("total")}: </span>
                                    <span className="font-semibold">
                                        {formatHoursMinutes(monthlyGrandTotal)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    {t("overtime")}:
                                </span>
                                <span
                                    className={`text-lg font-bold ${
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
                        </div>
                    </CardHeader>
                </Card>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <Card>
                    <CardHeader className="p-4 pb-2">
                        <div
                            className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${HOUR_TYPE_COLORS.GRAND_TOTAL}`}
                        >
                            {t("totalHours")}
                        </div>
                        {showWeekly ? (
                            <div className="flex flex-col gap-1 mt-2">
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        {tCommon("time.week")}
                                    </div>
                                    <div className="text-xl font-bold">
                                        {formatHoursMinutes(weeklyGrandTotal)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        {tCommon("time.month")}
                                    </div>
                                    <div className="text-xl font-bold">
                                        {formatHoursMinutes(monthlyGrandTotal)}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-2xl font-bold mt-2">
                                {formatHoursMinutes(monthlyGrandTotal)}
                            </div>
                        )}
                    </CardHeader>
                </Card>
                {HOUR_TYPES.map((hourType) => (
                    <Card key={hourType.value}>
                        <CardHeader className="p-4 pb-2">
                            <div
                                className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${HOUR_TYPE_COLORS[hourType.value]}`}
                            >
                                {tTypes(getHourTypeTranslationKey(hourType.value))}
                            </div>
                            {showWeekly ? (
                                <div className="flex flex-col gap-1 mt-2">
                                    <div>
                                        <div className="text-xs text-muted-foreground">
                                            {tCommon("time.week")}
                                        </div>
                                        <div className="text-lg font-semibold">
                                            {formatHoursMinutes(weeklyHoursByType[hourType.value])}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">
                                            {tCommon("time.month")}
                                        </div>
                                        <div className="text-lg font-semibold">
                                            {formatHoursMinutes(monthlyHoursByType[hourType.value])}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xl font-semibold mt-2">
                                    {formatHoursMinutes(monthlyHoursByType[hourType.value])}
                                </div>
                            )}
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    )
}
