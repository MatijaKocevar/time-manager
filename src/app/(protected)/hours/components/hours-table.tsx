"use client"

import { useMemo } from "react"
import { useTranslations, useLocale } from "next-intl"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import type { HourEntryDisplay } from "../schemas/hour-entry-schemas"
import { HOUR_TYPES } from "../constants/hour-types"
import type { ViewMode } from "../schemas/hour-filter-schemas"
import { EditableHourCell } from "./editable-hour-cell"
import { HourTypeRow } from "./hour-type-row"
import { useHoursBatchStore } from "../stores/hours-batch-store"
import {
    generateDateColumns,
    groupEntriesByType,
    getTypeLabel,
    getTypeColor,
} from "../utils/table-helpers"

interface HoursTableProps {
    entries: HourEntryDisplay[]
    viewMode: ViewMode
    startDate: string
    endDate: string
    userId: string
    holidays?: Array<{ date: Date; name: string }>
    initialExpandedTypes?: string[]
}

export function HoursTable({
    entries,
    startDate,
    endDate,
    userId,
    holidays = [],
    initialExpandedTypes = [],
}: HoursTableProps) {
    const t = useTranslations("hours.table")
    const tLabels = useTranslations("hours.labels")
    const tMessages = useTranslations("hours.messages")
    const pendingChanges = useHoursBatchStore((state) => state.pendingChanges)
    const locale = useLocale()
    const dateLocale = locale === "sl" ? "sl-SI" : "en-US"

    const holidaysByDate = useMemo(() => {
        const map = new Map<string, { name: string }>()
        holidays.forEach((holiday) => {
            const holidayDate = new Date(holiday.date)
            const year = holidayDate.getFullYear()
            const month = String(holidayDate.getMonth() + 1).padStart(2, "0")
            const day = String(holidayDate.getDate()).padStart(2, "0")
            const key = `${year}-${month}-${day}`
            map.set(key, { name: holiday.name })
        })
        return map
    }, [holidays])

    const isHoliday = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        const key = `${year}-${month}-${day}`
        return holidaysByDate.get(key)
    }

    const formatDateKey = (date: Date): string => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
    }

    const isToday = (date: Date) => {
        const today = new Date()
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        )
    }

    const displayEntries = entries.map((entry) => {
        const cellKey = `${formatDateKey(entry.date)}-${entry.type}`
        const pendingChange = pendingChanges.get(cellKey)

        if (pendingChange && entry.taskId === null) {
            return {
                ...entry,
                hours: pendingChange.hours,
            }
        }

        return entry
    })

    Array.from(pendingChanges.values()).forEach((change) => {
        if (change.action === "create") {
            const entryExists = displayEntries.some(
                (e) =>
                    formatDateKey(e.date) === change.date &&
                    e.type === change.type &&
                    e.taskId === null
            )

            if (!entryExists) {
                displayEntries.push({
                    id: `pending-${change.cellKey}`,
                    userId,
                    date: new Date(change.date),
                    hours: change.hours,
                    type: change.type,
                    description: null,
                    taskId: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
            }
        }
    })

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
                        <col style={{ width: "300px", minWidth: "300px", maxWidth: "300px" }} />
                        {dates.map((date) => (
                            <col
                                key={date.toISOString()}
                                style={{ width: "100px", minWidth: "100px" }}
                            />
                        ))}
                    </colgroup>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("columnType")}</TableHead>
                            {dates.map((date) => {
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6
                                const holiday = isHoliday(date)
                                return (
                                    <TableHead
                                        key={date.toISOString()}
                                        className={`text-center ${isWeekend ? "bg-muted/50" : ""} ${holiday ? "bg-purple-100 dark:bg-purple-950" : ""} ${isToday(date) ? "bg-primary/10" : ""}`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-xs font-normal text-muted-foreground">
                                                {date.toLocaleDateString(dateLocale, {
                                                    weekday: "short",
                                                })}
                                            </span>
                                            <span>{date.getDate()}</span>
                                            {holiday && (
                                                <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 mt-1">
                                                    {holiday.name}
                                                </span>
                                            )}
                                        </div>
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="font-medium">
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getTypeColor("GRAND_TOTAL")}`}
                                >
                                    {tLabels("grandTotal")} ({tMessages("allTypes")})
                                </span>
                            </TableCell>
                            {dates.map((date) => {
                                const year = date.getFullYear()
                                const month = String(date.getMonth() + 1).padStart(2, "0")
                                const day = String(date.getDate()).padStart(2, "0")
                                const dateKey = `${year}-${month}-${day}`

                                const entry = groupedEntries["GRAND_TOTAL"]?.[dateKey]
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6
                                const holiday = isHoliday(date)

                                return (
                                    <TableCell
                                        key={dateKey}
                                        className={`text-center p-2 relative ${isWeekend ? "bg-muted/50" : ""} ${holiday ? "bg-purple-100 dark:bg-purple-950" : ""} ${isToday(date) ? "bg-primary/5" : ""}`}
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
                                        <EditableHourCell
                                            date={date}
                                            type="WORK"
                                            entry={{
                                                ...entry,
                                                taskId: "grand_total",
                                            }}
                                            userId={userId}
                                            showProgressBar={false}
                                        />
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
                                userId={userId}
                                holidays={holidays}
                                initiallyExpanded={initialExpandedTypes.includes(hourType.value)}
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    }

    return renderWeeklyOrMonthlyView()
}
