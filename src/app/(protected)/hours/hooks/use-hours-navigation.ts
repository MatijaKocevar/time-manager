import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { ViewMode } from "../schemas/hour-filter-schemas"
import { VIEW_MODE_VALUES } from "../schemas/hour-filter-schemas"
import { getDateRange } from "../utils/view-helpers"

export function useHoursNavigation(initialViewMode: ViewMode, initialDate: Date) {
    const router = useRouter()
    const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode)
    const [currentDate, setCurrentDate] = useState<Date>(initialDate)

    useEffect(() => {
        const params = new URLSearchParams()
        params.set("view", viewMode)
        params.set("date", currentDate.toISOString().split("T")[0])
        router.replace(`?${params.toString()}`, { scroll: false })
    }, [viewMode, currentDate, router])

    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode)

        if (mode === VIEW_MODE_VALUES.MONTHLY && viewMode === VIEW_MODE_VALUES.WEEKLY) {
            const weekRange = getDateRange(VIEW_MODE_VALUES.WEEKLY, currentDate)
            const weekStart = new Date(weekRange.start)
            const weekEnd = new Date(weekRange.end)

            const startMonth = weekStart.getMonth()
            const endMonth = weekEnd.getMonth()

            if (startMonth !== endMonth) {
                const daysInStartMonth =
                    new Date(weekStart.getFullYear(), startMonth + 1, 0).getDate() -
                    weekStart.getDate() +
                    1
                const daysInEndMonth = weekEnd.getDate()

                const targetDate = daysInEndMonth > daysInStartMonth ? weekEnd : weekStart
                setCurrentDate(targetDate)
            }
        }
    }

    const handleNavigate = (direction: "prev" | "next") => {
        const newDate = new Date(currentDate)

        if (viewMode === VIEW_MODE_VALUES.WEEKLY) {
            newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
        } else {
            newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
        }

        setCurrentDate(newDate)
    }

    const getCurrentMonth = () => {
        const year = currentDate.getFullYear()
        const month = String(currentDate.getMonth() + 1).padStart(2, "0")
        return `${year}-${month}`
    }

    return {
        viewMode,
        currentDate,
        handleViewModeChange,
        handleNavigate,
        getCurrentMonth,
    }
}
