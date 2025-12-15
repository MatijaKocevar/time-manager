"use client"

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
}

export function HoursTable({ entries, startDate, endDate, userId }: HoursTableProps) {
    const pendingChanges = useHoursBatchStore((state) => state.pendingChanges)

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
                            <TableHead className="sticky left-0 bg-background z-20">Type</TableHead>
                            {dates.map((date) => {
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6
                                return (
                                    <TableHead
                                        key={date.toISOString()}
                                        className={`text-center ${isWeekend ? "bg-muted/50" : ""} ${isToday(date) ? "bg-primary/10" : ""}`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-xs font-normal text-muted-foreground">
                                                {date.toLocaleDateString("en-US", {
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
                            <TableCell className="font-medium sticky left-0 z-20 bg-background">
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getTypeColor("GRAND_TOTAL")}`}
                                >
                                    {getTypeLabel("GRAND_TOTAL")}
                                </span>
                            </TableCell>
                            {dates.map((date) => {
                                const year = date.getFullYear()
                                const month = String(date.getMonth() + 1).padStart(2, "0")
                                const day = String(date.getDate()).padStart(2, "0")
                                const dateKey = `${year}-${month}-${day}`

                                const entry = groupedEntries["GRAND_TOTAL"]?.[dateKey]
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6

                                return (
                                    <TableCell
                                        key={dateKey}
                                        className={`text-center p-2 relative ${isWeekend ? "bg-muted/50" : ""} ${isToday(date) ? "bg-primary/5" : ""}`}
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
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    }

    return renderWeeklyOrMonthlyView()
}
