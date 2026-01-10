import { useState } from "react"
import { useRouter } from "next/navigation"
import type { ViewMode } from "../schemas/hour-filter-schemas"
import { VIEW_MODE_VALUES } from "../schemas/hour-filter-schemas"

export function useHoursNavigation(initialViewMode: ViewMode, initialDate: Date) {
    const router = useRouter()
    const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode)
    const [currentDate, setCurrentDate] = useState<Date>(initialDate)

    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode)
        setCurrentDate(new Date())
        router.push(`/hours?view=${mode.toLowerCase()}`)
    }

    const handleNavigate = (direction: "prev" | "next") => {
        const newDate = new Date(currentDate)

        if (viewMode === VIEW_MODE_VALUES.WEEKLY) {
            newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
        } else {
            newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
        }

        setCurrentDate(newDate)
        const dateStr = newDate.toISOString().split("T")[0]
        router.push(`/hours?view=${viewMode.toLowerCase()}&date=${dateStr}`)
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
