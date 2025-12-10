"use client"

import { useMemo } from "react"
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
}

export function ShiftsCalendar({ initialShifts, users }: ShiftsCalendarProps) {
    const viewMode = useShiftCalendarStore((state) => state.viewMode)
    const currentDate = useShiftCalendarStore((state) => state.currentDate)
    const editDialog = useShiftCalendarStore((state) => state.editDialog)
    const setViewMode = useShiftCalendarStore((state) => state.setViewMode)
    const openEditDialog = useShiftCalendarStore((state) => state.openEditDialog)
    const closeEditDialog = useShiftCalendarStore((state) => state.closeEditDialog)
    const handlePrevious = useShiftCalendarStore((state) => state.handlePrevious)
    const handleNext = useShiftCalendarStore((state) => state.handleNext)
    const handleToday = useShiftCalendarStore((state) => state.handleToday)

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

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrevious}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleNext}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleToday}>
                        Today
                    </Button>
                    <h2 className="text-xl font-semibold ml-4">
                        {viewMode === "week"
                            ? `Week of ${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                            : currentDate.toLocaleDateString("en-US", {
                                  month: "long",
                                  year: "numeric",
                              })}
                    </h2>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={viewMode === "week" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("week")}
                    >
                        Week
                    </Button>
                    <Button
                        variant={viewMode === "month" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("month")}
                    >
                        Month
                    </Button>
                </div>
            </div>

            <div className="rounded-md border overflow-auto flex-1 min-h-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="sticky left-0 z-20 bg-[hsl(var(--background))] min-w-[150px]">
                                Employee
                            </TableHead>
                            {days.map((date) => {
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6
                                return (
                                    <TableHead
                                        key={date.toISOString()}
                                        className={`text-center min-w-[120px] ${isWeekend ? "bg-muted/50" : ""} ${isToday(date) ? "bg-primary/10" : ""}`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-xs font-normal text-muted-foreground">
                                                {date.toLocaleDateString("en-US", {
                                                    weekday: "short",
                                                })}
                                            </span>
                                            <span>
                                                {date.toLocaleDateString("en-US", {
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
                        {users.map((user) => (
                            <TableRow key={user.id} className="hover:bg-muted/50">
                                <TableCell className="sticky left-0 z-20 bg-[hsl(var(--background))] hover:bg-muted/50 font-medium transition-colors">
                                    <div>{user.name || "Unknown"}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {user.email}
                                    </div>
                                </TableCell>
                                {days.map((date) => {
                                    const shift = getShift(user.id, date)
                                    const colors = shift
                                        ? SHIFT_LOCATION_COLORS[shift.location]
                                        : { bg: "bg-background", text: "text-muted-foreground" }
                                    const isWeekend = date.getDay() === 0 || date.getDay() === 6

                                    return (
                                        <TableCell
                                            key={date.toISOString()}
                                            className={`text-center p-2 cursor-pointer ${
                                                isWeekend ? "bg-muted/50" : ""
                                            } ${isToday(date) ? "bg-primary/5" : ""}`}
                                            onClick={() =>
                                                handleCellClick(user.id, user.name, date)
                                            }
                                        >
                                            <div
                                                className={`rounded-md p-2 text-xs ${colors.bg} ${colors.text} min-h-10 flex items-center justify-center`}
                                            >
                                                {shift
                                                    ? SHIFT_LOCATION_COLORS[shift.location].label
                                                    : SHIFT_LOCATION_COLORS.OFFICE.label}
                                            </div>
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
