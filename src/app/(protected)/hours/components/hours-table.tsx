"use client"

import { useMemo } from "react"
import { useTranslations, useLocale } from "next-intl"
import { SPECIAL_TYPES, HOUR_TYPE_VALUES, TASK_ID_VALUES } from "../constants/hour-types"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { HourEntryDisplay } from "../schemas/hour-entry-schemas"
import { HOUR_TYPES } from "../constants/hour-types"
import type { ViewMode } from "../schemas/hour-filter-schemas"
import { HourTypeRow } from "./hour-type-row"
import { useHoursBatchStore } from "../stores/hours-batch-store"
import { generateDateColumns, groupEntriesByType, getTypeColor } from "../utils/table-helpers"
import { formatDateKey, isToday, buildHolidayMap } from "../utils/date-helpers"
import { mergeEntriesWithPendingChanges } from "../utils/entry-helpers"
import { formatHoursToTime } from "../utils/time-helpers"

interface HoursTableProps {
    entries: HourEntryDisplay[]
    viewMode: ViewMode
    startDate: string
    endDate: string
    userId: string
    holidays?: Array<{ date: Date; name: string }>
}

export function HoursTable({
    entries,
    startDate,
    endDate,
    userId,
    holidays = [],
}: HoursTableProps) {
    const t = useTranslations("hours.table")
    const tLabels = useTranslations("hours.labels")
    const tMessages = useTranslations("hours.messages")
    const pendingChanges = useHoursBatchStore((state) => state.pendingChanges)
    const locale = useLocale()
    const dateLocale = locale === "sl" ? "sl-SI" : "en-US"

    const holidaysByDate = useMemo(() => buildHolidayMap(holidays), [holidays])

    const isHoliday = (date: Date) => {
        const key = formatDateKey(date)
        return holidaysByDate.get(key)
    }

    const displayEntries = mergeEntriesWithPendingChanges(entries, pendingChanges, userId)

    const renderWeeklyOrMonthlyView = () => {
        const dates = generateDateColumns(startDate, endDate)
        const groupedEntries = groupEntriesByType(entries)
        const displayGroupedEntries = { ...groupedEntries }

        HOUR_TYPES.forEach((hourType) => {
            const manualKey = `${hourType.value}_MANUAL`
            const manualDisplayEntries = displayEntries.filter(
                (e) => e.type === hourType.value && e.taskId === null
            )
            if (manualDisplayEntries.length > 0) {
                displayGroupedEntries[manualKey] = {}
                manualDisplayEntries.forEach((entry) => {
                    const dateKey = formatDateKey(entry.date)
                    displayGroupedEntries[manualKey][dateKey] = entry
                })
            }
        })

        return (
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <colgroup>
                        <col style={{ width: "200px", minWidth: "150px", maxWidth: "200px" }} />
                        {dates.map((date) => (
                            <col
                                key={date.toISOString()}
                                style={{ width: "100px", minWidth: "100px" }}
                            />
                        ))}
                    </colgroup>
                    <TableHeader className="sticky top-0 z-30 bg-background">
                        <TableRow>
                            <TableHead className="sticky top-0 left-0 z-40 bg-background min-w-[150px] max-w-[200px] border-r">
                                {t("columnType")}
                            </TableHead>
                            {dates.map((date) => {
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6
                                const holiday = isHoliday(date)
                                return (
                                    <TableHead
                                        key={date.toISOString()}
                                        className={`text-center ${isWeekend ? "bg-muted/50" : ""} ${holiday ? "bg-orange-100 dark:bg-orange-950" : ""} ${isToday(date) ? "bg-primary/10" : ""}`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-xs font-normal text-muted-foreground">
                                                {date.toLocaleDateString(dateLocale, {
                                                    weekday: "short",
                                                })}
                                            </span>
                                            <span>{date.getDate()}</span>
                                        </div>
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="font-medium sticky left-0 z-10 bg-background min-w-[150px] max-w-[200px] border-r">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="cursor-default">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold truncate ${getTypeColor(SPECIAL_TYPES.GRAND_TOTAL)}`}
                                            >
                                                {tLabels("grandTotal")} ({tMessages("allTypes")})
                                            </span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <div className="text-sm">
                                            {tLabels("grandTotal")} ({tMessages("allTypes")})
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TableCell>
                            {dates.map((date) => {
                                const year = date.getFullYear()
                                const month = String(date.getMonth() + 1).padStart(2, "0")
                                const day = String(date.getDate()).padStart(2, "0")
                                const dateKey = `${year}-${month}-${day}`

                                const entry = groupedEntries[SPECIAL_TYPES.GRAND_TOTAL]?.[dateKey]
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6
                                const holiday = isHoliday(date)

                                return (
                                    <TableCell
                                        key={dateKey}
                                        className={`text-center p-2 relative ${isWeekend ? "bg-muted/50" : ""} ${holiday ? "bg-orange-100 dark:bg-orange-950" : ""} ${isToday(date) ? "bg-primary/5" : ""}`}
                                    >
                                        {entry && entry.hours > 0 && (
                                            <div className="absolute top-0 left-0 right-0 h-0.5 flex">
                                                <div
                                                    className="bg-blue-500"
                                                    style={{
                                                        width: `${Math.min((entry.hours / 8) * 100, 100)}%`,
                                                    }}
                                                />
                                                {entry.hours > 8 && (
                                                    <div
                                                        className="bg-red-500"
                                                        style={{
                                                            width: `${((entry.hours - 8) / 8) * 100}%`,
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        )}
                                        <div
                                            className={`h-8 w-16 text-center flex items-center justify-center rounded mx-auto font-bold ${
                                                (entry?.hours || 0) === 0
                                                    ? "text-muted-foreground"
                                                    : "text-foreground"
                                            }`}
                                        >
                                            {(entry?.hours || 0) === 0
                                                ? "-"
                                                : formatHoursToTime(entry.hours)}
                                        </div>
                                    </TableCell>
                                )
                            })}
                        </TableRow>

                        {HOUR_TYPES.map((hourType) => (
                            <HourTypeRow
                                key={hourType.value}
                                hourType={hourType.value}
                                dates={dates}
                                groupedEntries={displayGroupedEntries}
                                holidays={holidays}
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    }

    return renderWeeklyOrMonthlyView()
}
