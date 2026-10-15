"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
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

interface ShiftDetailsDialogProps {
    selectedDayShifts: {
        date: Date
        user: UserWithWorkHours
        shifts: ShiftDisplay[]
        absences: UrnikAbsence[]
        overtimeUse: OvertimeUseDay[]
    } | null
    onClose: () => void
    locale: string
    translations: {
        title: (params: { date: string }) => string
        employee: string
        noShifts: string
        close: string
        allDay: string
    }
    locationsTranslations: Record<string, string>
}

export function ShiftDetailsDialog({
    selectedDayShifts,
    onClose,
    locale,
    translations,
    locationsTranslations,
}: ShiftDetailsDialogProps) {
    const dateLocale = locale === "sl" ? "sl-SI" : "en-US"

    return (
        <Dialog open={!!selectedDayShifts} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md max-h-[85vh] flex flex-col gap-0 p-0 sm:p-6">
                <DialogHeader className="flex-shrink-0 pb-4 px-6 pt-6 sm:px-0 sm:pt-0">
                    <DialogTitle>
                        {selectedDayShifts &&
                            translations.title({
                                date: selectedDayShifts.date.toLocaleDateString(dateLocale, {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                }),
                            })}
                    </DialogTitle>
                </DialogHeader>
                {selectedDayShifts && (
                    <div className="flex flex-col flex-1 min-h-0">
                        <div className="space-y-4 overflow-y-auto px-6 sm:px-0">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">
                                    {translations.employee}
                                </div>
                                <div className="text-base font-semibold">
                                    {selectedDayShifts.user.name || selectedDayShifts.user.email}
                                </div>
                            </div>
                            {selectedDayShifts.shifts.length === 0 &&
                            selectedDayShifts.absences.length === 0 &&
                            selectedDayShifts.overtimeUse.length === 0 ? (
                                <div className="text-sm text-muted-foreground py-4 text-center">
                                    {translations.noShifts}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selectedDayShifts.shifts.map((shift) => {
                                        const userWorkStart =
                                            selectedDayShifts.user.workStartTime || "08:00"
                                        const userWorkEnd =
                                            selectedDayShifts.user.workEndTime || "16:00"
                                        const [workStartHour, workStartMinute] = userWorkStart
                                            .split(":")
                                            .map(Number)
                                        const [workEndHour, workEndMinute] = userWorkEnd
                                            .split(":")
                                            .map(Number)

                                        const isPartialDay =
                                            shift.startDateTime &&
                                            shift.endDateTime &&
                                            (new Date(shift.startDateTime).getHours() !==
                                                workStartHour ||
                                                new Date(shift.startDateTime).getMinutes() !==
                                                    workStartMinute ||
                                                new Date(shift.endDateTime).getHours() !==
                                                    workEndHour ||
                                                new Date(shift.endDateTime).getMinutes() !==
                                                    workEndMinute)

                                        const timeRange =
                                            isPartialDay && shift.startDateTime && shift.endDateTime
                                                ? `${new Date(shift.startDateTime).toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit", hour12: false })} - ${new Date(shift.endDateTime).toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit", hour12: false })}`
                                                : translations.allDay

                                        return (
                                            <div
                                                key={shift.id}
                                                className={`rounded-lg p-3 ${SHIFT_LOCATION_COLORS[shift.location].bg} ${SHIFT_LOCATION_COLORS[shift.location].text}`}
                                            >
                                                <div className="font-semibold mb-1">
                                                    {locationsTranslations[
                                                        getShiftLocationTranslationKey(
                                                            shift.location
                                                        )
                                                    ] || shift.location}
                                                </div>
                                                <div className="text-sm opacity-90">
                                                    {timeRange}
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {selectedDayShifts.overtimeUse.map((entry) => (
                                        <div
                                            key={`${entry.userId}-${entry.dateString}`}
                                            className={`rounded-lg p-3 ${OVERTIME_USE_BADGE_COLORS.bg} ${OVERTIME_USE_BADGE_COLORS.text}`}
                                        >
                                            <div className="font-semibold mb-1">
                                                {locationsTranslations.overtimeUse}
                                            </div>
                                            <div className="text-sm opacity-90">
                                                {entry.startTime && entry.endTime
                                                    ? `${entry.startTime} - ${entry.endTime}`
                                                    : translations.allDay}
                                            </div>
                                        </div>
                                    ))}
                                    {selectedDayShifts.absences.map((absence) => {
                                        const translationKey = getUrnikAbsenceTranslationKey(
                                            absence.badge
                                        )
                                        const colors = URNIK_ABSENCE_BADGE_COLORS[absence.badge]

                                        return (
                                            <div
                                                key={`${absence.userId}-${absence.dateString}`}
                                                className={`rounded-lg p-3 ${colors.bg} ${colors.text}`}
                                            >
                                                <div className="font-semibold mb-1">
                                                    {locationsTranslations[translationKey] ||
                                                        absence.badge}
                                                </div>
                                                <div className="text-sm opacity-90">
                                                    {translations.allDay}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="flex-shrink-0 flex justify-end pt-4 border-t px-6 pb-6 sm:px-0 sm:pb-0">
                            <Button variant="outline" onClick={onClose}>
                                {translations.close}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
