"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { formatDateToLocal } from "@/lib/utils"
import { useRequestStore } from "../../requests/stores/request-store"
import { createRequest } from "../../requests/actions/request-actions"
import { REQUEST_TYPE } from "../../requests/constants"
import { type RequestType } from "../../requests/schemas/request-schemas"
import type { UserWithWorkHours, ShiftDisplay } from "../schemas/shift-schemas"
import { ShiftsCalendarHeader } from "./shifts-calendar-header"
import { ShiftsTable } from "./shifts-table"
import { RequestFormDialog } from "./request-form-dialog"
import { ShiftDetailsDialog } from "./shift-details-dialog"

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

    const isToday = (date: Date) => {
        const today = new Date()
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        )
    }

    const handleCellClick = (date: Date, user: UserWithWorkHours, shifts: ShiftDisplay[]) => {
        if (shifts.length > 0) {
            setSelectedDayShifts({ date, user, shifts })
        } else {
            resetForm()
            const dateString = formatDateToLocal(date)
            setFormData({ startDate: dateString, endDate: dateString })
            setIsRequestDialogOpen(true)
        }
    }

    const handleDialogClose = () => {
        setIsRequestDialogOpen(false)
        resetForm()
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

    const handlePrevious = () => {
        const newDate = new Date(currentDate)
        if (viewMode === "week") {
            newDate.setDate(currentDate.getDate() - 7)
        } else {
            newDate.setMonth(currentDate.getMonth() - 1)
        }
        const dateStr = formatDateToLocal(newDate)
        router.push(`/shifts?view=${viewMode}&date=${dateStr}`)
    }

    const handleNext = () => {
        const newDate = new Date(currentDate)
        if (viewMode === "week") {
            newDate.setDate(currentDate.getDate() + 7)
        } else {
            newDate.setMonth(currentDate.getMonth() + 1)
        }
        const dateStr = formatDateToLocal(newDate)
        router.push(`/shifts?view=${viewMode}&date=${dateStr}`)
    }

    const handleToday = () => {
        const dateStr = formatDateToLocal(new Date())
        router.push(`/shifts?view=${viewMode}&date=${dateStr}`)
    }

    const handleViewModeChange = (mode: "week" | "month") => {
        const dateStr = formatDateToLocal(currentDate)
        router.push(`/shifts?view=${mode}&date=${dateStr}`)
    }

    const locationsMap: Record<string, string> = {}
    const locationsShortMap: Record<string, string> = {}

    ;["office", "home", "vacation", "sickLeave"].forEach((key) => {
        locationsMap[key] = tLocations(key as never)
        locationsShortMap[key] = tLocationsShort(key as never)
    })

    return (
        <div className="flex flex-col gap-4 h-full">
            <ShiftsCalendarHeader
                viewMode={viewMode}
                currentDate={currentDate}
                startDate={startDate}
                dateLocale={dateLocale}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onToday={handleToday}
                onViewModeChange={handleViewModeChange}
                translations={{
                    today: tCommon("time.today"),
                    weekView: t("views.weekView"),
                    monthView: t("views.monthView"),
                    weekOf: (params: { date: string }) => t("views.weekOf", params),
                }}
            />

            <ShiftsTable
                days={days}
                users={users}
                dateLocale={dateLocale}
                getShifts={getShifts}
                isHoliday={isHoliday}
                isToday={isToday}
                onCellClick={handleCellClick}
                translations={{
                    employee: t("table.employee"),
                    unknown: t("table.unknown"),
                }}
                locationsTranslations={locationsMap}
                locationsShortTranslations={locationsShortMap}
            />

            <RequestFormDialog
                isOpen={isRequestDialogOpen}
                onClose={handleDialogClose}
                formData={formData}
                onFormDataChange={setFormData}
                onSubmit={handleSubmit}
                isPending={mutation.isPending}
                error={mutation.data?.error || null}
                requestedHours={requestedHours}
                translations={{
                    newRequest: tRequestForm("newRequest"),
                    selectType: tRequestForm("selectType"),
                    selectStartDate: tRequestForm("selectStartDate"),
                    selectEndDate: tRequestForm("selectEndDate"),
                    fullDay: tRequestForm("fullDay"),
                    startTime: tRequestForm("startTime"),
                    endTime: tRequestForm("endTime"),
                    requestedHours: tRequestForm("requestedHours"),
                    hours: tRequestForm("hours"),
                    skipWeekends: tRequestForm("skipWeekends"),
                    skipHolidays: tRequestForm("skipHolidays"),
                    enterLocation: tRequestForm("enterLocation"),
                    enterReason: tRequestForm("enterReason"),
                    reasonOptional: tRequestForm("reasonOptional"),
                    submitRequest: tRequestForm("submitRequest"),
                    submitting: tCommon("status.submitting"),
                    type: tCommon("fields.type"),
                    startDateLabel: tCommon("fields.startDate"),
                    endDateLabel: tCommon("fields.endDate"),
                    location: tCommon("fields.location"),
                }}
                requestTypesTranslations={Object.fromEntries(
                    ["vacation", "sickLeave", "workFromHome"].map((key) => [
                        key,
                        tRequestTypes(key as never),
                    ])
                )}
            />

            <ShiftDetailsDialog
                selectedDayShifts={selectedDayShifts}
                onClose={() => setSelectedDayShifts(null)}
                locale={locale}
                translations={{
                    title: (params: { date: string }) => tDialog("title", params),
                    employee: t("table.employee"),
                    noShifts: tDialog("noShifts"),
                    close: tDialog("close"),
                    allDay: tCommon("time.allDay"),
                }}
                locationsTranslations={locationsMap}
            />
        </div>
    )
}
