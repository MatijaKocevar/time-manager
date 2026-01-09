"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { SHIFT_LOCATION_COLORS } from "../constants"
import { getShiftLocationTranslationKey } from "../utils/translation-helpers"
import type { UserWithWorkHours, ShiftDisplay } from "../schemas/shift-schemas"

interface ShiftsTableProps {
    days: Date[]
    users: UserWithWorkHours[]
    dateLocale: string
    getShifts: (userId: string, date: Date) => ShiftDisplay[]
    isHoliday: (date: Date) => { name: string } | undefined
    isToday: (date: Date) => boolean
    onCellClick: (date: Date, user: UserWithWorkHours, shifts: ShiftDisplay[]) => void
    translations: {
        employee: string
        unknown: string
    }
    locationsTranslations: Record<string, string>
    locationsShortTranslations: Record<string, string>
}

export function ShiftsTable({
    days,
    users,
    dateLocale,
    getShifts,
    isHoliday,
    isToday,
    onCellClick,
    translations,
    locationsTranslations,
    locationsShortTranslations,
}: ShiftsTableProps) {
    return (
        <div className="rounded-md border overflow-auto flex-1 min-h-0">
            <Table>
                <TableHeader className="sticky top-0 z-30 bg-background">
                    <TableRow>
                        <TableHead className="sticky top-0 left-0 z-40 bg-background min-w-[150px] max-w-[200px] border-r">
                            {translations.employee}
                        </TableHead>
                        {days.map((date) => {
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6
                            const holiday = isHoliday(date)
                            return (
                                <TableHead
                                    key={date.toISOString()}
                                    className={`text-center min-w-[120px] ${isWeekend ? "bg-muted/50" : ""} ${holiday ? "bg-purple-100 dark:bg-purple-950" : ""} ${isToday(date) ? "bg-primary/10" : ""}`}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-xs font-normal text-muted-foreground">
                                            {date.toLocaleDateString(dateLocale, {
                                                weekday: "short",
                                            })}
                                        </span>
                                        <span>
                                            {date.toLocaleDateString(dateLocale, {
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </span>
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
                    {users.map((user) => (
                        <TableRow key={user.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium sticky left-0 z-10 bg-background min-w-[150px] max-w-[200px] border-r">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="cursor-default">
                                            <div className="truncate">
                                                {user.name || translations.unknown}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {user.email}
                                            </div>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <div className="text-sm">
                                            <div className="font-medium">
                                                {user.name || translations.unknown}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {user.email}
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TableCell>
                            {days.map((date) => {
                                const shifts = getShifts(user.id, date)
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6
                                const holiday = isHoliday(date)
                                const shouldShowDefault =
                                    !isWeekend && !holiday && shifts.length === 0

                                return (
                                    <TableCell
                                        key={date.toISOString()}
                                        className={`text-center p-2 cursor-pointer ${
                                            isWeekend ? "bg-muted/50" : ""
                                        } ${holiday ? "bg-purple-100 dark:bg-purple-950" : ""} ${isToday(date) ? "bg-primary/5" : ""}`}
                                        onClick={() => onCellClick(date, user, shifts)}
                                    >
                                        <div className="flex flex-wrap gap-1 justify-center items-center min-h-[40px] p-1">
                                            {shouldShowDefault && (
                                                <div
                                                    className={`rounded px-1.5 py-1 text-[10px] font-semibold ${SHIFT_LOCATION_COLORS.OFFICE.bg} ${SHIFT_LOCATION_COLORS.OFFICE.text}`}
                                                >
                                                    {locationsShortTranslations.office || "Office"}
                                                </div>
                                            )}
                                            {shifts.map((shift) => {
                                                const isPartialDay =
                                                    shift.startDateTime &&
                                                    shift.endDateTime &&
                                                    (new Date(shift.startDateTime).getHours() !==
                                                        0 ||
                                                        new Date(
                                                            shift.startDateTime
                                                        ).getMinutes() !== 0 ||
                                                        new Date(shift.endDateTime).getHours() !==
                                                            23 ||
                                                        new Date(shift.endDateTime).getMinutes() !==
                                                            59)

                                                const timeRange =
                                                    isPartialDay &&
                                                    shift.startDateTime &&
                                                    shift.endDateTime
                                                        ? `${new Date(shift.startDateTime).toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit", hour12: false })}-${new Date(shift.endDateTime).toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit", hour12: false })}`
                                                        : null

                                                return (
                                                    <Tooltip key={shift.id}>
                                                        <TooltipTrigger asChild>
                                                            <div
                                                                className={`rounded px-1.5 py-1 text-[10px] font-semibold ${SHIFT_LOCATION_COLORS[shift.location].bg} ${SHIFT_LOCATION_COLORS[shift.location].text} cursor-pointer hover:opacity-80`}
                                                            >
                                                                {locationsShortTranslations[
                                                                    getShiftLocationTranslationKey(
                                                                        shift.location
                                                                    )
                                                                ] || shift.location}
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <div className="text-xs">
                                                                <div className="font-semibold">
                                                                    {locationsTranslations[
                                                                        getShiftLocationTranslationKey(
                                                                            shift.location
                                                                        )
                                                                    ] || shift.location}
                                                                </div>
                                                                {timeRange && (
                                                                    <div className="text-muted-foreground mt-1">
                                                                        {timeRange}
                                                                    </div>
                                                                )}
                                                                {shift.notes && (
                                                                    <div className="text-muted-foreground mt-1 max-w-[200px]">
                                                                        {shift.notes}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )
                                            })}
                                        </div>
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
