"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { getHourEntriesForUser } from "@/app/(protected)/hours/actions/hour-actions"
import { getDateRange, getViewTitle } from "@/app/(protected)/hours/utils/view-helpers"
import { VIEW_MODE_VALUES } from "@/app/(protected)/hours/schemas/hour-filter-schemas"
import { getHolidaysInRange } from "@/app/(protected)/admin/holidays/actions/holiday-actions"
import { exportUserDetailsWithHours } from "../../actions/export-actions"
import { type ExportFormat } from "@/features/export"
import { userHourKeys } from "../../query-keys"
import { useHoursStore } from "@/app/(protected)/hours/stores/hours-store"
import { TASK_ID_VALUES } from "@/app/(protected)/hours/constants/hour-types"
import { useUserHoursSectionStore } from "../stores/user-hours-store"
import type { HourEntryDisplay } from "@/app/(protected)/hours/schemas/hour-entry-schemas"
import type { HourType } from "@/app/(protected)/hours/schemas/hour-action-schemas"

interface UseUserHoursSectionParams {
    userId: string
    initialEntries: HourEntryDisplay[]
    initialHolidays: Array<{ date: Date }>
}

export function useUserHoursSection({
    userId,
    initialEntries,
    initialHolidays,
}: UseUserHoursSectionParams) {
    const currentDate = useUserHoursSectionStore((s) => s.currentDate)
    const isExportDialogOpen = useUserHoursSectionStore((s) => s.isExportDialogOpen)
    const setCurrentDate = useUserHoursSectionStore((s) => s.setCurrentDate)
    const setIsExportDialogOpen = useUserHoursSectionStore((s) => s.setIsExportDialogOpen)
    const openHourTypeDialog = useHoursStore((s) => s.openHourTypeDialog)

    const { startDate, endDate, start, end } = getDateRange(VIEW_MODE_VALUES.MONTHLY, currentDate)
    const monthTitle = getViewTitle(VIEW_MODE_VALUES.MONTHLY, { start, end }, currentDate)

    const { data: entries = initialEntries, isLoading } = useQuery({
        queryKey: userHourKeys.detail(userId, startDate),
        queryFn: () => getHourEntriesForUser(userId, startDate, endDate),
        initialData: initialEntries,
    })

    const { data: holidays = initialHolidays } = useQuery({
        queryKey: ["holidays", startDate, endDate],
        queryFn: () => getHolidaysInRange(startDate, endDate),
        initialData: initialHolidays,
    })

    const prepareHourTypeData = useMemo(() => {
        return (type: string) => {
            const filteredEntries = entries.filter(
                (entry: HourEntryDisplay) =>
                    entry.type === type && entry.taskId === TASK_ID_VALUES.TOTAL
            )

            const entriesByDate = filteredEntries.reduce(
                (acc, entry) => {
                    const dateKey = entry.date.toISOString().split("T")[0]
                    if (!acc[dateKey]) {
                        acc[dateKey] = { date: entry.date, hours: 0 }
                    }
                    acc[dateKey].hours += entry.hours
                    return acc
                },
                {} as Record<string, { date: Date; hours: number }>
            )

            return Object.values(entriesByDate).filter((entry) => entry.hours > 0)
        }
    }, [entries])

    function handleHourTypeClick(type: string) {
        const data = prepareHourTypeData(type)
        openHourTypeDialog(type as HourType, data)
    }

    function handleNavigate(direction: "prev" | "next") {
        const newDate = new Date(currentDate)
        newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
        setCurrentDate(newDate)
    }

    async function handleExport(format: ExportFormat, months: string[]) {
        return await exportUserDetailsWithHours({ format, months, userId })
    }

    function getCurrentMonth() {
        const year = currentDate.getFullYear()
        const month = String(currentDate.getMonth() + 1).padStart(2, "0")
        return `${year}-${month}`
    }

    return {
        entries,
        holidays,
        isLoading,
        isExportDialogOpen,
        monthTitle,
        dateRange: { start, end },
        currentMonth: getCurrentMonth(),
        setIsExportDialogOpen,
        handleNavigate,
        handleHourTypeClick,
        handleExport,
    }
}
