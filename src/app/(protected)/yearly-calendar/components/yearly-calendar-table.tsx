"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import type { HourType } from "@/../../prisma/generated/client"
import { type DayData } from "../actions/yearly-calendar-actions"
import { isValidDate, createDateKey, parseLocalDate } from "../utils/date-helpers"
import { HOUR_TYPE_ABBREVIATIONS } from "../utils/hour-type-abbreviations"
import { getWorkTypeColor, type WorkType } from "@/lib/work-type-styles"
import { useTimeSheetsStore } from "@/app/(protected)/time-sheets/stores/time-sheets-store"
import { useMemo } from "react"
import { useHolidays } from "@/app/(protected)/time-sheets/hooks/use-holidays"

interface YearlyCalendarTableProps {
    year: number
    data: Record<string, DayData>
    initialHolidays: Array<{ date: Date; name: string }>
    translations: {
        months: string[]
    }
}

function buildHolidayMap(holidays: Array<{ date: Date; name: string }>) {
    const map = new Map<string, { date: Date; name: string }>()
    holidays.forEach((holiday) => {
        const key = `${holiday.date.getFullYear()}-${String(holiday.date.getMonth() + 1).padStart(2, "0")}-${String(holiday.date.getDate()).padStart(2, "0")}`
        map.set(key, holiday)
    })
    return map
}

export function YearlyCalendarTable({
    year,
    data,
    initialHolidays,
    translations,
}: YearlyCalendarTableProps) {
    const openDayEntriesDialog = useTimeSheetsStore((state) => state.openDayEntriesDialog)
    const startOfYear = new Date(year, 0, 1).toISOString()
    const endOfYear = new Date(year, 11, 31, 23, 59, 59).toISOString()
    const holidays = useHolidays(startOfYear, endOfYear, initialHolidays)

    const holidaysByDate = useMemo(() => buildHolidayMap(holidays), [holidays])

    const handleCellClick = (dateKey: string, hasData: boolean) => {
        if (hasData) {
            const date = parseLocalDate(dateKey)
            openDayEntriesDialog(date.toISOString())
        }
    }

    const days = Array.from({ length: 31 }, (_, i) => i + 1)

    return (
        <div className="border rounded-lg overflow-auto h-full">
            <Table className="h-full">
                <colgroup>
                    <col style={{ width: "120px", minWidth: "120px" }} />
                    {days.map((day) => (
                        <col key={day} style={{ width: "70px", minWidth: "70px" }} />
                    ))}
                </colgroup>
                <TableHeader className="sticky top-0 z-30 bg-background">
                    <TableRow>
                        <TableHead className="sticky left-0 z-40 bg-background border-r font-semibold text-center"></TableHead>
                        {days.map((day) => (
                            <TableHead key={day} className="text-center text-xs p-1">
                                {day}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody className="[&_tr]:h-[calc((100vh-240px)/12)] landscape:sm:[&_tr]:min-h-[80px] landscape:sm:[&_tr]:h-auto">
                    {Array.from({ length: 12 }, (_, monthIndex) => {
                        const month = monthIndex + 1

                        return (
                            <TableRow key={month}>
                                <TableCell className="sticky left-0 z-20 bg-background border-r font-semibold text-center align-middle">
                                    {translations.months[monthIndex]}
                                </TableCell>
                                {days.map((day) => {
                                    const isValid = isValidDate(year, month, day)

                                    if (!isValid) {
                                        return (
                                            <TableCell
                                                key={day}
                                                className="p-0.5 text-center opacity-30 pointer-events-none bg-muted/30 align-middle"
                                            />
                                        )
                                    }

                                    const dateKey = createDateKey(year, month, day)
                                    const dayData = data[dateKey]
                                    const hasData = !!dayData && dayData.totalHours > 0

                                    const date = new Date(year, month - 1, day)
                                    const isWeekendDay = date.getDay() === 0 || date.getDay() === 6
                                    const holiday = holidaysByDate.get(dateKey)

                                    let bgClass = ""
                                    if (holiday) {
                                        bgClass = "bg-orange-100 dark:bg-orange-950"
                                    } else if (isWeekendDay) {
                                        bgClass = "bg-muted/50"
                                    }

                                    return (
                                        <TableCell
                                            key={day}
                                            className={`p-0.5 text-center align-middle ${bgClass} ${hasData ? "cursor-pointer hover:ring-2 hover:ring-primary" : ""}`}
                                            onClick={() => handleCellClick(dateKey, hasData)}
                                        >
                                            {hasData && (
                                                <div className="flex flex-col gap-0.5 items-center">
                                                    <div className="flex flex-wrap gap-0.5 justify-center">
                                                        {Object.entries(dayData.types).map(
                                                            ([type, hours]) => {
                                                                const hourType = type as HourType
                                                                const abbreviation =
                                                                    HOUR_TYPE_ABBREVIATIONS[
                                                                        hourType
                                                                    ]
                                                                const workType =
                                                                    hourType as WorkType
                                                                const colorClass = getWorkTypeColor(
                                                                    workType,
                                                                    "default"
                                                                )

                                                                return (
                                                                    <span
                                                                        key={type}
                                                                        className={`inline-block px-1 py-0 rounded text-[9px] font-medium ${colorClass}`}
                                                                        title={`${hourType}: ${Number(hours).toFixed(1)}h`}
                                                                    >
                                                                        {abbreviation}
                                                                    </span>
                                                                )
                                                            }
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] font-semibold text-foreground mt-0.5">
                                                        {(() => {
                                                            const hours = Math.floor(
                                                                dayData.totalHours
                                                            )
                                                            const minutes = Math.round(
                                                                (dayData.totalHours - hours) * 60
                                                            )
                                                            return minutes > 0
                                                                ? `${hours}h ${minutes}m`
                                                                : `${hours}h`
                                                        })()}
                                                    </div>
                                                </div>
                                            )}
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
