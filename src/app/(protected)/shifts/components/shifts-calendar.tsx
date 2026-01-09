"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { SHIFT_LOCATION_COLORS } from "../constants"
import { getShiftLocationTranslationKey } from "../utils/translation-helpers"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { useRequestStore } from "../../requests/stores/request-store"
import { createRequest } from "../../requests/actions/request-actions"
import { REQUEST_TYPES, REQUEST_TYPE } from "../../requests/constants"
import { type RequestType } from "../../requests/schemas/request-schemas"
import { getRequestTypeTranslationKey } from "../../requests/utils/translation-helpers"
import { format } from "date-fns"
import type { UserWithWorkHours, ShiftDisplay } from "../schemas/shift-schemas"

interface ShiftsCalendarProps {
    initialShifts: ShiftDisplay[]
    users: UserWithWorkHours[]
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
    const tLocationsShort = useTranslations("shifts.locationsShort")
    const tDialog = useTranslations("shifts.dialog")
    const tRequestForm = useTranslations("requests.form")
    const tRequestTypes = useTranslations("requests.types")
    const locale = useLocale()
    const dateLocale = locale === "sl" ? "sl-SI" : "en-US"
    const router = useRouter()
    const queryClient = useQueryClient()
    const viewMode = initialViewMode
    const currentDate = initialSelectedDate
    const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
    const [selectedDayShifts, setSelectedDayShifts] = useState<{
        date: Date
        user: UserWithWorkHours
        shifts: ShiftDisplay[]
    } | null>(null)

    const formData = useRequestStore((state) => state.formData)
    const setFormData = useRequestStore((state) => state.setFormData)
    const resetForm = useRequestStore((state) => state.resetForm)

    const mutation = useMutation({
        mutationFn: createRequest,
        onSuccess: (result) => {
            if (result.success) {
                queryClient.invalidateQueries()
                resetForm()
                setIsRequestDialogOpen(false)
            }
        },
    })

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
        const map = new Map<string, ShiftDisplay[]>()
        initialShifts.forEach((shift) => {
            const key = `${shift.userId}-${shift.dateString}`
            const existing = map.get(key) || []
            map.set(key, [...existing, shift])
        })
        return map
    }, [initialShifts])

    const getShifts = (userId: string, date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        const dateStr = `${year}-${month}-${day}`
        const key = `${userId}-${dateStr}`
        return shiftsByUserAndDate.get(key) || []
    }

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

    const handleCellClick = (date: Date, user: UserWithWorkHours, shifts: ShiftDisplay[]) => {
        if (shifts.length > 0) {
            setSelectedDayShifts({ date, user, shifts })
        } else {
            resetForm()
            const dateString = date.toISOString().split("T")[0]
            setFormData({ startDate: dateString, endDate: dateString })
            setIsRequestDialogOpen(true)
        }
    }

    const handleDialogClose = (open: boolean) => {
        if (!open) {
            setIsRequestDialogOpen(false)
            resetForm()
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.type || !formData.startDate || !formData.endDate) return

        mutation.mutate({
            type: formData.type as RequestType,
            startDate: formData.startDate,
            endDate: formData.endDate,
            startTime: formData.isFullDay ? undefined : formData.startTime,
            endTime: formData.isFullDay ? undefined : formData.endTime,
            isFullDay: formData.isFullDay,
            reason: formData.reason,
            location: formData.type === REQUEST_TYPE.WORK_FROM_HOME ? formData.location : undefined,
            skipWeekends: formData.skipWeekends,
            skipHolidays: formData.skipHolidays,
        })
    }

    const calculateRequestedHours = () => {
        if (
            formData.isFullDay ||
            !formData.startDate ||
            !formData.endDate ||
            !formData.startTime ||
            !formData.endTime
        ) {
            return null
        }

        const [startHour, startMin] = formData.startTime.split(":").map(Number)
        const [endHour, endMin] = formData.endTime.split(":").map(Number)

        const start = new Date(formData.startDate)
        start.setHours(startHour, startMin, 0, 0)

        const end = new Date(formData.endDate)
        end.setHours(endHour, endMin, 0, 0)

        const diffMs = end.getTime() - start.getTime()
        return diffMs / (1000 * 60 * 60)
    }

    const requestedHours = calculateRequestedHours()

    const needsLocation = formData.type === REQUEST_TYPE.WORK_FROM_HOME

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
                    <TableHeader className="sticky top-0 z-30 bg-background">
                        <TableRow>
                            <TableHead className="sticky top-0 left-0 z-40 bg-background min-w-[150px] max-w-[200px] border-r">
                                {t("table.employee")}
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
                                                    {user.name || t("table.unknown")}
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <div className="text-sm">
                                                <div className="font-medium">
                                                    {user.name || t("table.unknown")}
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
                                            onClick={() => handleCellClick(date, user, shifts)}
                                        >
                                            <div className="flex flex-wrap gap-1 justify-center items-center min-h-[40px] p-1">
                                                {shouldShowDefault && (
                                                    <div
                                                        className={`rounded px-1.5 py-1 text-[10px] font-semibold ${SHIFT_LOCATION_COLORS.OFFICE.bg} ${SHIFT_LOCATION_COLORS.OFFICE.text}`}
                                                    >
                                                        {tLocationsShort("office")}
                                                    </div>
                                                )}
                                                {shifts.map((shift) => {
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
                                                                    {tLocationsShort(
                                                                        getShiftLocationTranslationKey(
                                                                            shift.location
                                                                        )
                                                                    )}
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <div className="text-xs">
                                                                    <div className="font-semibold">
                                                                        {tLocations(
                                                                            getShiftLocationTranslationKey(
                                                                                shift.location
                                                                            )
                                                                        )}
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

            <Dialog open={isRequestDialogOpen} onOpenChange={handleDialogClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{tRequestForm("newRequest")}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="type">{tCommon("fields.type")}</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) =>
                                    setFormData({ type: value as RequestType })
                                }
                            >
                                <SelectTrigger id="type">
                                    <SelectValue placeholder={tRequestForm("selectType")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {REQUEST_TYPES.map((rt) => (
                                        <SelectItem key={rt.value} value={rt.value}>
                                            {tRequestTypes(getRequestTypeTranslationKey(rt.value))}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">{tCommon("fields.startDate")}</Label>
                                <DatePicker
                                    date={
                                        formData.startDate
                                            ? new Date(formData.startDate)
                                            : undefined
                                    }
                                    onDateChange={(date) =>
                                        setFormData({
                                            startDate: date ? format(date, "yyyy-MM-dd") : "",
                                        })
                                    }
                                    placeholder={tRequestForm("selectStartDate")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">{tCommon("fields.endDate")}</Label>
                                <DatePicker
                                    date={formData.endDate ? new Date(formData.endDate) : undefined}
                                    onDateChange={(date) =>
                                        setFormData({
                                            endDate: date ? format(date, "yyyy-MM-dd") : "",
                                        })
                                    }
                                    placeholder={tRequestForm("selectEndDate")}
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="full-day"
                                checked={formData.isFullDay}
                                onCheckedChange={(checked) =>
                                    setFormData({ isFullDay: checked === true })
                                }
                            />
                            <Label htmlFor="full-day" className="cursor-pointer font-normal">
                                {tRequestForm("fullDay")}
                            </Label>
                        </div>

                        {!formData.isFullDay && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startTime">{tRequestForm("startTime")}</Label>
                                    <Select
                                        value={formData.startTime}
                                        onValueChange={(value) => setFormData({ startTime: value })}
                                    >
                                        <SelectTrigger id="startTime">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 24 }, (_, i) => {
                                                const hour = i.toString().padStart(2, "0")
                                                return ["00", "15", "30", "45"].map((min) => {
                                                    const time = `${hour}:${min}`
                                                    return (
                                                        <SelectItem key={time} value={time}>
                                                            {time}
                                                        </SelectItem>
                                                    )
                                                })
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endTime">{tRequestForm("endTime")}</Label>
                                    <Select
                                        value={formData.endTime}
                                        onValueChange={(value) => setFormData({ endTime: value })}
                                    >
                                        <SelectTrigger id="endTime">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 24 }, (_, i) => {
                                                const hour = i.toString().padStart(2, "0")
                                                return ["00", "15", "30", "45"].map((min) => {
                                                    const time = `${hour}:${min}`
                                                    return (
                                                        <SelectItem key={time} value={time}>
                                                            {time}
                                                        </SelectItem>
                                                    )
                                                })
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {requestedHours !== null && !formData.isFullDay && (
                            <div className="text-sm text-muted-foreground">
                                {tRequestForm("requestedHours")}: {requestedHours.toFixed(2)}{" "}
                                {tRequestForm("hours")}
                            </div>
                        )}

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="skip-weekends"
                                checked={formData.skipWeekends}
                                onCheckedChange={(checked) =>
                                    setFormData({ skipWeekends: checked === true })
                                }
                            />
                            <Label htmlFor="skip-weekends" className="cursor-pointer font-normal">
                                {tRequestForm("skipWeekends")}
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="skip-holidays"
                                checked={formData.skipHolidays}
                                onCheckedChange={(checked) =>
                                    setFormData({ skipHolidays: checked === true })
                                }
                            />
                            <Label htmlFor="skip-holidays" className="cursor-pointer font-normal">
                                {tRequestForm("skipHolidays")}
                            </Label>
                        </div>

                        {needsLocation && (
                            <div className="space-y-2">
                                <Label htmlFor="location">{tCommon("fields.location")}</Label>
                                <Input
                                    id="location"
                                    type="text"
                                    placeholder={tRequestForm("enterLocation")}
                                    value={formData.location}
                                    onChange={(e) => setFormData({ location: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="reason">{tRequestForm("reasonOptional")}</Label>
                            <Input
                                id="reason"
                                type="text"
                                placeholder={tRequestForm("enterReason")}
                                value={formData.reason}
                                onChange={(e) => setFormData({ reason: e.target.value })}
                            />
                        </div>

                        {mutation.data?.error && (
                            <div className="text-sm text-red-600">{mutation.data.error}</div>
                        )}

                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending
                                ? tCommon("status.submitting")
                                : tRequestForm("submitRequest")}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!selectedDayShifts}
                onOpenChange={(open) => !open && setSelectedDayShifts(null)}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedDayShifts &&
                                tDialog("title", {
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
                        <div className="space-y-4">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">
                                    {t("table.employee")}
                                </div>
                                <div className="text-base font-semibold">
                                    {selectedDayShifts.user.name || selectedDayShifts.user.email}
                                </div>
                            </div>
                            {selectedDayShifts.shifts.length === 0 ? (
                                <div className="text-sm text-muted-foreground py-4 text-center">
                                    {tDialog("noShifts")}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selectedDayShifts.shifts.map((shift) => {
                                        const isPartialDay =
                                            shift.startDateTime &&
                                            shift.endDateTime &&
                                            (new Date(shift.startDateTime).getHours() !== 0 ||
                                                new Date(shift.startDateTime).getMinutes() !== 0 ||
                                                new Date(shift.endDateTime).getHours() !== 23 ||
                                                new Date(shift.endDateTime).getMinutes() !== 59)

                                        const timeRange =
                                            isPartialDay && shift.startDateTime && shift.endDateTime
                                                ? `${new Date(shift.startDateTime).toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit", hour12: false })} - ${new Date(shift.endDateTime).toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit", hour12: false })}`
                                                : tCommon("time.allDay") || "All Day"

                                        return (
                                            <div
                                                key={shift.id}
                                                className={`rounded-lg p-3 ${SHIFT_LOCATION_COLORS[shift.location].bg} ${SHIFT_LOCATION_COLORS[shift.location].text}`}
                                            >
                                                <div className="font-semibold mb-1">
                                                    {tLocations(
                                                        getShiftLocationTranslationKey(
                                                            shift.location
                                                        )
                                                    )}
                                                </div>
                                                <div className="text-sm opacity-90">
                                                    {timeRange}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                            <div className="flex justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedDayShifts(null)}
                                >
                                    {tDialog("close")}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
