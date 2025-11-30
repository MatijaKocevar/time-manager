"use client"

import { useQueryClient } from "@tanstack/react-query"
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
import { hourKeys } from "../query-keys"
import { EditableHourCell } from "./editable-hour-cell"
import {
    generateDateColumns,
    groupEntriesByType,
    getTypeLabel,
    getTypeColor,
    getRowBgColor,
} from "../utils/table-helpers"

interface HoursTableProps {
    entries: HourEntryDisplay[]
    viewMode: ViewMode
    startDate: string
    endDate: string
}

export function HoursTable({ entries, startDate, endDate }: HoursTableProps) {
    const queryClient = useQueryClient()

    const handleUpdate = () => {
        queryClient.invalidateQueries({ queryKey: hourKeys.all })
    }

    const renderWeeklyOrMonthlyView = () => {
        const dates = generateDateColumns(startDate, endDate)
        const groupedEntries = groupEntriesByType(entries)

        const allRowKeys: string[] = []
        HOUR_TYPES.forEach((hourType) => {
            const trackedKey = `${hourType.value}_TRACKED`
            const manualKey = `${hourType.value}_MANUAL`
            const totalKey = `${hourType.value}_TOTAL`

            allRowKeys.push(totalKey)
            allRowKeys.push(trackedKey)
            allRowKeys.push(manualKey)
        })

        return (
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[100px] sticky left-0 bg-background z-10">
                                Type
                            </TableHead>
                            {dates.map((date) => {
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6
                                return (
                                    <TableHead
                                        key={date.toISOString()}
                                        className={`text-center min-w-20 ${isWeekend ? "bg-muted/50" : ""}`}
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
                        {allRowKeys.map((rowKey) => {
                            const baseType = rowKey
                                .replace("_TRACKED", "")
                                .replace("_MANUAL", "")
                                .replace("_TOTAL", "")
                            const isReadOnly = rowKey.includes("_TRACKED")
                            const isTotal = rowKey.includes("_TOTAL")

                            return (
                                <TableRow key={rowKey} className={getRowBgColor(rowKey)}>
                                    <TableCell
                                        className={`font-medium sticky left-0 z-10 ${getRowBgColor(rowKey)}`}
                                    >
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getTypeColor(rowKey)}`}
                                        >
                                            {getTypeLabel(rowKey)}
                                        </span>
                                    </TableCell>
                                    {dates.map((date) => {
                                        const year = date.getFullYear()
                                        const month = String(date.getMonth() + 1).padStart(2, "0")
                                        const day = String(date.getDate()).padStart(2, "0")
                                        const dateKey = `${year}-${month}-${day}`

                                        const entry = groupedEntries[rowKey]?.[dateKey]
                                        const isWeekend = date.getDay() === 0 || date.getDay() === 6

                                        return (
                                            <TableCell
                                                key={dateKey}
                                                className={`text-center p-2 ${isWeekend ? "bg-muted/50" : ""}`}
                                            >
                                                <EditableHourCell
                                                    entry={
                                                        isReadOnly || isTotal
                                                            ? {
                                                                  ...entry,
                                                                  taskId: isTotal
                                                                      ? "total"
                                                                      : "tracked",
                                                              }
                                                            : entry
                                                    }
                                                    dateKey={dateKey}
                                                    type={baseType}
                                                    onUpdate={handleUpdate}
                                                />
                                            </TableCell>
                                        )
                                    })}
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        )
    }

    return renderWeeklyOrMonthlyView()
}
