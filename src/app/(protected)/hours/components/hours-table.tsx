"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import { deleteHourEntry } from "../actions/hour-actions"
import { useHoursStore } from "../stores/hours-store"
import type { HourEntryDisplay } from "../schemas/hour-entry-schemas"
import { HOUR_TYPES } from "../constants/hour-types"
import type { ViewMode } from "../schemas/hour-filter-schemas"
import { EditHourDialog } from "./edit-hour-dialog"
import { hourKeys } from "../query-keys"
import {
    generateDateColumns,
    groupEntriesByType,
    formatEntryDate,
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
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const initializeEditForm = useHoursStore((state) => state.initializeEditForm)

    const handleEditClick = (entry: HourEntryDisplay) => {
        const dateStr = formatEntryDate(entry.date)
        initializeEditForm({
            id: entry.id,
            date: dateStr,
            hours: entry.hours,
            type: entry.type,
            description: entry.description || "",
        })
        setIsEditDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this entry?")) return

        const result = await deleteHourEntry({ id })
        if (result.error) {
            alert(result.error)
        } else {
            queryClient.invalidateQueries({ queryKey: hourKeys.all })
        }
    }

    const renderWeeklyOrMonthlyView = () => {
        const dates = generateDateColumns(startDate, endDate)
        const groupedEntries = groupEntriesByType(entries)
        const allTypes = HOUR_TYPES.map((t) => t.value)

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
                        {allTypes.map((type) => (
                            <TableRow key={type}>
                                <TableCell className="font-medium sticky left-0 bg-background z-10">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getTypeColor(type)}`}
                                    >
                                        {getTypeLabel(type)}
                                    </span>
                                </TableCell>
                                {dates.map((date) => {
                                    const year = date.getFullYear()
                                    const month = String(date.getMonth() + 1).padStart(2, "0")
                                    const day = String(date.getDate()).padStart(2, "0")
                                    const dateKey = `${year}-${month}-${day}`
                                    const entry = groupedEntries[type]?.[dateKey]
                                    const isWeekend = date.getDay() === 0 || date.getDay() === 6

                                    return (
                                        <TableCell
                                            key={dateKey}
                                            className={`text-center p-2 ${isWeekend ? "bg-muted/50" : ""}`}
                                        >
                                            {entry ? (
                                                <div className="flex flex-col items-center group relative">
                                                    <span className="font-semibold">
                                                        {entry.hours}
                                                    </span>
                                                    {entry.description && (
                                                        <span className="text-xs text-muted-foreground truncate max-w-[60px]">
                                                            {entry.description}
                                                        </span>
                                                    )}
                                                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                            onClick={() => handleEditClick(entry)}
                                                        >
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                            onClick={() => handleDelete(entry.id)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    }

    return (
        <>
            {renderWeeklyOrMonthlyView()}
            <EditHourDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
        </>
    )
}
