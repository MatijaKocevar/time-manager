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
import { HourTypeRow } from "./hour-type-row"
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
}

export function HoursTable({ entries, startDate, endDate }: HoursTableProps) {
    const queryClient = useQueryClient()

    const handleUpdate = () => {
        queryClient.invalidateQueries({ queryKey: hourKeys.all })
    }

    const renderWeeklyOrMonthlyView = () => {
        const dates = generateDateColumns(startDate, endDate)
        const groupedEntries = groupEntriesByType(entries)

        return (
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[100px] sticky left-0 bg-background z-20">
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
                                        className={`text-center p-2 ${isWeekend ? "bg-muted/50" : ""}`}
                                    >
                                        <EditableHourCell
                                            entry={{
                                                ...entry,
                                                taskId: "grand_total",
                                            }}
                                            dateKey={dateKey}
                                            type="WORK"
                                            onUpdate={handleUpdate}
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
                                groupedEntries={groupedEntries}
                                onUpdate={handleUpdate}
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    }

    return renderWeeklyOrMonthlyView()
}
