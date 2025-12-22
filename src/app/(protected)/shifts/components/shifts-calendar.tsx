"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { EditShiftDialog } from "./edit-shift-dialog"
import { SHIFT_LOCATION_COLORS } from "../constants"
import { useShiftCalendarStore } from "../stores"
import type { ShiftLocation } from "../schemas/shift-schemas"
import { getShiftLocationTranslationKey } from "../utils/translation-helpers"

interface User {
    id: string
    name: string | null
    email: string
}

interface Shift {
    id: string
    userId: string
    date: Date
    location: ShiftLocation
    notes: string | null
    user: User
}

interface ShiftsCalendarProps {
    initialShifts: Shift[]
    users: User[]
    initialHolidays?: Array<{ date: Date; name: string }>
    initialViewMode: "week" | "month"
    initialSelectedDate: Date
}

export function ShiftsCalendar({
    initialShifts,
    users,
    initialHolidays = [],
    initialViewMode,
    initialSelectedDate,
}: ShiftsCalendarProps) {
    const t = useTranslations("shifts")
    const tCommon = useTranslations("common")
    const tLocations = useTranslations("shifts.locations")
    const locale = useLocale()
    const dateLocale = locale === "sl" ? "sl-SI" : "en-US"
    const router = useRouter()
    const viewMode = initialViewMode
    const currentDate = initialSelectedDate
    const editDialog = useShiftCalendarStore((state) => state.editDialog)
    const openEditDialog = useShiftCalendarStore((state) => state.openEditDialog)
    const closeEditDialog = useShiftCalendarStore((state) => state.closeEditDialog)

    const { startDate, days } = useMemo(() => {
        if (viewMode === "week") {
            const dayOfWeek = currentDate.getDay()
            const start = new Date(currentDate)
            start.setDate(currentDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
            start.setHours(0, 0, 0, 0)

            const end = new Date(start)
            end.setDate(start.getDate() + 6)
            end.setHours(23, 59, 59, 999)

            const days = Array.from({ length: 7 }, (_, i) => {
                const date = new Date(start)
                date.setDate(start.getDate() + i)
                date.setHours(0, 0, 0, 0)
                return date
            })

            return { startDate: start, endDate: end, days }
        } else {
            const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
            start.setHours(0, 0, 0, 0)
            const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
            end.setHours(0, 0, 0, 0)

            const days = Array.from({ length: end.getDate() }, (_, i) => {
                const date = new Date(start)
                date.setDate(i + 1)
                date.setHours(0, 0, 0, 0)
                return date
            })

            return { startDate: start, endDate: end, days }
        }
    }, [currentDate, viewMode])

    const shiftsByUserAndDate = useMemo(() => {
        const map = new Map<string, Shift>()
        initialShifts.forEach((shift) => {
            const key = `${shift.userId}-${shift.date.toISOString().split("T")[0]}`
            map.set(key, shift)
        })
        return map
    }, [initialShifts])

    const holidaysByDate = useMemo(() => {
        const map = new Map<string, { name: string }>()
        initialHolidays.forEach((holiday) => {
            const holidayDate = new Date(holiday.date)
            const year = holidayDate.getFullYear()
            const month = String(holidayDate.getMonth() + 1).padStart(2, "0")
            const day = String(holidayDate.getDate()).padStart(2, "0")
            const key = `${year}-${month}-${day}`
            map.set(key, { name: holiday.name })
        })
        return map
    }, [initialHolidays])

    const isHoliday = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        const key = `${year}-${month}-${day}`
        return holidaysByDate.get(key)
    }

    const getShift = (userId: string, date: Date) => {
        const key = `${userId}-${date.toISOString().split("T")[0]}`
        return shiftsByUserAndDate.get(key)
    }

    const handleCellClick = (userId: string, userName: string | null, date: Date) => {
        const shift = getShift(userId, date)
        openEditDialog({
            date,
            userId,
            userName: userName || undefined,
            currentLocation: shift?.location,
            currentNotes: shift?.notes || undefined,
        })
    }

    const isToday = (date: Date) => {
        const today = new Date()
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        )
    }

    const handlePrevious = () => {
        const newDate = new Date(currentDate)
        if (viewMode === "week") {
            newDate.setDate(currentDate.getDate() - 7)
        } else {
            newDate.setMonth(currentDate.getMonth() - 1)
        }
        const dateStr = newDate.toISOString().split("T")[0]
        router.push(`/shifts?view=${viewMode}&date=${dateStr}`)
    }

    const handleNext = () => {
        const newDate = new Date(currentDate)
        if (viewMode === "week") {
            newDate.setDate(currentDate.getDate() + 7)
        } else {
            newDate.setMonth(currentDate.getMonth() + 1)
        }
        const dateStr = newDate.toISOString().split("T")[0]
        router.push(`/shifts?view=${viewMode}&date=${dateStr}`)
    }

    const handleToday = () => {
        const dateStr = new Date().toISOString().split("T")[0]
        router.push(`/shifts?view=${viewMode}&date=${dateStr}`)
    }

    const handleViewModeChange = (mode: "week" | "month") => {
        const dateStr = currentDate.toISOString().split("T")[0]
        router.push(`/shifts?view=${mode}&date=${dateStr}`)
    }

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 shrink-0">
                <div className="flex items-center justify-between lg:justify-start gap-2">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handlePrevious}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleNext}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleToday}>
                            {tCommon("time.today")}
                        </Button>
                    </div>
                    <div className="flex gap-2 lg:hidden">
                        <Button
                            variant={viewMode === "week" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleViewModeChange("week")}
                        >
                            {t("views.weekView")}
                        </Button>
                        <Button
                            variant={viewMode === "month" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleViewModeChange("month")}
                        >
                            {t("views.monthView")}
                        </Button>
                    </div>
                </div>
                <h2 className="text-xl font-semibold text-center lg:text-left lg:ml-4">
                    {viewMode === "week"
                        ? t("views.weekOf", {
                              date: startDate.toLocaleDateString(dateLocale, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                              }),
                          })
                        : currentDate.toLocaleDateString(dateLocale, {
                              month: "long",
                              year: "numeric",
                          })}
                </h2>
                <div className="hidden lg:flex gap-2">
                    <Button
                        variant={viewMode === "week" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleViewModeChange("week")}
                    >
                        {t("views.weekView")}
                    </Button>
                    <Button
                        variant={viewMode === "month" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleViewModeChange("month")}
                    >
                        {t("views.monthView")}
                    </Button>
                </div>
            </div>

            <div className="rounded-md border overflow-auto flex-1 min-h-0">
                <Table>
                    <TableHeader className="sticky top-0 z-10 bg-background">
                        <TableRow>
                            <TableHead className="min-w-[150px]">{t("table.employee")}</TableHead>
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
                                <TableCell className="font-medium">
                                    <div>{user.name || t("table.unknown")}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {user.email}
                                    </div>
                                </TableCell>
                                {days.map((date) => {
                                    const shift = getShift(user.id, date)
                                    const isWeekend = date.getDay() === 0 || date.getDay() === 6
                                    const holiday = isHoliday(date)
                                    const shouldShowDefault = !isWeekend && !holiday
                                    const location =
                                        shift?.location || (shouldShowDefault ? "OFFICE" : null)

                                    return (
                                        <TableCell
                                            key={date.toISOString()}
                                            className={`text-center p-2 cursor-pointer ${
                                                isWeekend ? "bg-muted/50" : ""
                                            } ${holiday ? "bg-purple-100 dark:bg-purple-950" : ""} ${isToday(date) ? "bg-primary/5" : ""}`}
                                            onClick={() =>
                                                handleCellClick(user.id, user.name, date)
                                            }
                                        >
                                            {location && (
                                                <div
                                                    className={`rounded-md p-2 text-xs ${SHIFT_LOCATION_COLORS[location].bg} ${SHIFT_LOCATION_COLORS[location].text} min-h-10 flex items-center justify-center`}
                                                >
                                                    {tLocations(
                                                        getShiftLocationTranslationKey(location)
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <EditShiftDialog
                isOpen={editDialog.isOpen}
                onClose={closeEditDialog}
                date={editDialog.date}
                userId={editDialog.userId}
                userName={editDialog.userName}
                currentLocation={editDialog.currentLocation}
                currentNotes={editDialog.currentNotes}
            />
        </div>
    )
}
