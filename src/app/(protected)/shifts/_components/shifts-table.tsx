"use client"

import { Fragment } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
    SHIFT_LOCATION,
    SHIFT_LOCATION_COLORS,
    URNIK_ABSENCE_BADGE_COLORS,
    OVERTIME_USE_BADGE_COLORS,
} from "../_constants"
import {
    getShiftLocationTranslationKey,
    getUrnikAbsenceTranslationKey,
} from "../_utils/translation-helpers"
import type { UserWithWorkHours, ShiftDisplay, OvertimeUseDay } from "../_schemas/shift-schemas"
import type { UrnikAbsence } from "../_schemas/urnik-absence-schemas"

interface ShiftsTableProps {
    days: Date[]
    users: UserWithWorkHours[]
    urnikUsers: UserWithWorkHours[]
    dateLocale: string
    getShifts: (userId: string, date: Date) => ShiftDisplay[]
    getUrnikAbsences: (userId: string, date: Date) => UrnikAbsence[]
    getOvertimeUse: (userId: string, date: Date) => OvertimeUseDay[]
    isHoliday: (date: Date) => { name: string } | undefined
    isToday: (date: Date) => boolean
    onCellClick: (
        date: Date,
        user: UserWithWorkHours,
        shifts: ShiftDisplay[],
        absences: UrnikAbsence[],
        overtimeUse: OvertimeUseDay[]
    ) => void
    translations: {
        employee: string
        unknown: string
        urnikSection: string
    }
    locationsTranslations: Record<string, string>
    locationsShortTranslations: Record<string, string>
}

export function ShiftsTable({
    days,
    users,
    urnikUsers,
    dateLocale,
    getShifts,
    getUrnikAbsences,
    getOvertimeUse,
    isHoliday,
    isToday,
    onCellClick,
    translations,
    locationsTranslations,
    locationsShortTranslations,
}: ShiftsTableProps) {
    return (
        <div id="shifts-table" className="rounded-md border overflow-auto flex-1 min-h-0">
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
                                    className={`text-center min-w-[120px] ${isWeekend ? "bg-muted/50" : ""} ${holiday ? "bg-orange-100 dark:bg-orange-950" : ""} ${isToday(date) ? "bg-primary/10" : ""}`}
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
                                    </div>
                                </TableHead>
                            )
                        })}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...users, ...urnikUsers].map((user, index) => (
                        <Fragment key={user.id}>
                            {urnikUsers.length > 0 && index === users.length && (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell className="sticky left-0 z-10 bg-muted/40 text-xs font-semibold tracking-wide uppercase text-muted-foreground min-w-[150px] max-w-[200px] border-r">
                                        {translations.urnikSection}
                                    </TableCell>
                                    <TableCell colSpan={days.length} className="bg-muted/40" />
                                </TableRow>
                            )}
                            <TableRow className="hover:bg-muted/50">
                                <TableCell className="font-medium sticky left-0 z-10 bg-background min-w-[150px] max-w-[200px] border-r">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="cursor-default">
                                                <div className="truncate">
                                                    {user.name || translations.unknown}
                                                </div>
                                                {user.email && (
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {user.email}
                                                    </div>
                                                )}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <div className="text-sm">
                                                <div className="font-medium">
                                                    {user.name || translations.unknown}
                                                </div>
                                                {user.email && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {user.email}
                                                    </div>
                                                )}
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TableCell>
                                {days.map((date) => {
                                    const shifts = getShifts(user.id, date)
                                    const urnikAbsences = getUrnikAbsences(user.id, date)
                                    const overtimeUse = getOvertimeUse(user.id, date)
                                    const isWeekend = date.getDay() === 0 || date.getDay() === 6
                                    const holiday = isHoliday(date)

                                    return (
                                        <TableCell
                                            key={date.toISOString()}
                                            className={`shifts-cell text-center p-2 cursor-pointer ${
                                                isWeekend ? "bg-muted/50" : ""
                                            } ${holiday ? "bg-orange-100 dark:bg-orange-950" : ""} ${isToday(date) ? "bg-primary/5" : ""}`}
                                            onClick={() =>
                                                onCellClick(
                                                    date,
                                                    user,
                                                    shifts,
                                                    urnikAbsences,
                                                    overtimeUse
                                                )
                                            }
                                        >
                                            <div className="flex flex-wrap gap-1 justify-center items-center min-h-[40px] p-1">
                                                {shifts
                                                    .filter(
                                                        (shift) =>
                                                            shift.location !== SHIFT_LOCATION.OFFICE
                                                    )
                                                    .map((shift) => {
                                                        const isPartialDay =
                                                            shift.startDateTime &&
                                                            shift.endDateTime &&
                                                            (new Date(
                                                                shift.startDateTime
                                                            ).getHours() !== 0 ||
                                                                new Date(
                                                                    shift.startDateTime
                                                                ).getMinutes() !== 0 ||
                                                                new Date(
                                                                    shift.endDateTime
                                                                ).getHours() !== 23 ||
                                                                new Date(
                                                                    shift.endDateTime
                                                                ).getMinutes() !== 59)

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
                                                {overtimeUse.map((entry) => (
                                                    <Tooltip
                                                        key={`${entry.userId}-${entry.dateString}`}
                                                    >
                                                        <TooltipTrigger asChild>
                                                            <div
                                                                className={`rounded px-1.5 py-1 text-[10px] font-semibold ${OVERTIME_USE_BADGE_COLORS.bg} ${OVERTIME_USE_BADGE_COLORS.text} cursor-pointer hover:opacity-80`}
                                                            >
                                                                {locationsShortTranslations.overtimeUse ||
                                                                    "OVT"}
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <div className="text-xs">
                                                                <div className="font-semibold">
                                                                    {
                                                                        locationsTranslations.overtimeUse
                                                                    }
                                                                </div>
                                                                {entry.startTime &&
                                                                    entry.endTime && (
                                                                        <div className="text-muted-foreground mt-1">
                                                                            {entry.startTime} -{" "}
                                                                            {entry.endTime}
                                                                        </div>
                                                                    )}
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ))}
                                                {urnikAbsences.map((absence) => {
                                                    const translationKey =
                                                        getUrnikAbsenceTranslationKey(absence.badge)
                                                    const colors =
                                                        URNIK_ABSENCE_BADGE_COLORS[absence.badge]

                                                    return (
                                                        <Tooltip
                                                            key={`${absence.userId}-${absence.dateString}`}
                                                        >
                                                            <TooltipTrigger asChild>
                                                                <div
                                                                    className={`rounded px-1.5 py-1 text-[10px] font-semibold ${colors.bg} ${colors.text} cursor-pointer hover:opacity-80`}
                                                                >
                                                                    {locationsShortTranslations[
                                                                        translationKey
                                                                    ] || absence.badge}
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <div className="text-xs">
                                                                    <div className="font-semibold">
                                                                        {locationsTranslations[
                                                                            translationKey
                                                                        ] || absence.badge}
                                                                    </div>
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
                        </Fragment>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
