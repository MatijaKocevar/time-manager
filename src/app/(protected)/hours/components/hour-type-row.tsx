"use client"

import { ChevronDown, ChevronRight } from "lucide-react"
import { Fragment } from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import { useHoursStore } from "../stores/hours-store"
import { EditableHourCell } from "./editable-hour-cell"
import { getTypeLabel, getTypeColor } from "../utils/table-helpers"
import type { HourEntryDisplay } from "../schemas/hour-entry-schemas"

interface HourTypeRowProps {
    hourType: string
    dates: Date[]
    groupedEntries: Record<string, Record<string, HourEntryDisplay>>
    onUpdate: () => void
}

export function HourTypeRow({ hourType, dates, groupedEntries, onUpdate }: HourTypeRowProps) {
    const expandedTypes = useHoursStore((state) => state.expandedTypes)
    const toggleType = useHoursStore((state) => state.toggleType)

    const isExpanded = expandedTypes.has(hourType)

    const trackedKey = `${hourType}_TRACKED`
    const manualKey = `${hourType}_MANUAL`
    const totalKey = `${hourType}_TOTAL`

    const handleToggle = () => {
        toggleType(hourType)
    }

    return (
        <>
            <TableRow>
                <TableCell className="font-medium sticky left-0 z-20 bg-background">
                    <div className="flex items-center gap-2">
                        <button onClick={handleToggle} className="p-1 hover:bg-muted rounded">
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </button>
                        <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getTypeColor(totalKey)}`}
                        >
                            {getTypeLabel(totalKey)}
                        </span>
                    </div>
                </TableCell>
                {dates.map((date) => {
                    const year = date.getFullYear()
                    const month = String(date.getMonth() + 1).padStart(2, "0")
                    const day = String(date.getDate()).padStart(2, "0")
                    const dateKey = `${year}-${month}-${day}`

                    const entry = groupedEntries[totalKey]?.[dateKey]
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6

                    return (
                        <TableCell
                            key={dateKey}
                            className={`text-center p-2 ${isWeekend ? "bg-muted/50" : ""}`}
                        >
                            <EditableHourCell
                                entry={{
                                    ...entry,
                                    taskId: "total",
                                }}
                                dateKey={dateKey}
                                type={hourType}
                                onUpdate={onUpdate}
                            />
                        </TableCell>
                    )
                })}
            </TableRow>

            {isExpanded && (
                <>
                    <TableRow>
                        <TableCell className="font-medium sticky left-0 z-20 bg-background">
                            <div className="pl-8">
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getTypeColor(trackedKey)}`}
                                >
                                    {getTypeLabel(trackedKey)}
                                </span>
                            </div>
                        </TableCell>
                        {dates.map((date) => {
                            const year = date.getFullYear()
                            const month = String(date.getMonth() + 1).padStart(2, "0")
                            const day = String(date.getDate()).padStart(2, "0")
                            const dateKey = `${year}-${month}-${day}`

                            const entry = groupedEntries[trackedKey]?.[dateKey]
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6

                            return (
                                <TableCell
                                    key={dateKey}
                                    className={`text-center p-2 ${isWeekend ? "bg-muted/50" : ""}`}
                                >
                                    <EditableHourCell
                                        entry={{
                                            ...entry,
                                            taskId: "tracked",
                                        }}
                                        dateKey={dateKey}
                                        type={hourType}
                                        onUpdate={onUpdate}
                                    />
                                </TableCell>
                            )
                        })}
                    </TableRow>

                    <TableRow>
                        <TableCell className="font-medium sticky left-0 z-20 bg-background">
                            <div className="pl-8">
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getTypeColor(manualKey)}`}
                                >
                                    {getTypeLabel(manualKey)}
                                </span>
                            </div>
                        </TableCell>
                        {dates.map((date) => {
                            const year = date.getFullYear()
                            const month = String(date.getMonth() + 1).padStart(2, "0")
                            const day = String(date.getDate()).padStart(2, "0")
                            const dateKey = `${year}-${month}-${day}`

                            const entry = groupedEntries[manualKey]?.[dateKey]
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6

                            return (
                                <TableCell
                                    key={dateKey}
                                    className={`text-center p-2 ${isWeekend ? "bg-muted/50" : ""}`}
                                >
                                    <EditableHourCell
                                        entry={entry}
                                        dateKey={dateKey}
                                        type={hourType}
                                        onUpdate={onUpdate}
                                    />
                                </TableCell>
                            )
                        })}
                    </TableRow>
                </>
            )}
        </>
    )
}
