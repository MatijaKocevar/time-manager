"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ShiftsCalendarHeaderProps {
    viewMode: "week" | "month"
    currentDate: Date
    startDate: Date
    dateLocale: string
    onPrevious: () => void
    onNext: () => void
    onToday: () => void
    onViewModeChange: (mode: "week" | "month") => void
    translations: {
        today: string
        weekView: string
        monthView: string
        weekOf: (params: { date: string }) => string
    }
}

export function ShiftsCalendarHeader({
    viewMode,
    currentDate,
    startDate,
    dateLocale,
    onPrevious,
    onNext,
    onToday,
    onViewModeChange,
    translations,
}: ShiftsCalendarHeaderProps) {
    return (
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 shrink-0">
            <div className="flex items-center justify-between lg:justify-start gap-2">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={onPrevious}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={onNext}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={onToday}>
                        {translations.today}
                    </Button>
                </div>
                <div className="flex gap-2 lg:hidden">
                    <Button
                        variant={viewMode === "week" ? "default" : "outline"}
                        size="sm"
                        onClick={() => onViewModeChange("week")}
                    >
                        {translations.weekView}
                    </Button>
                    <Button
                        variant={viewMode === "month" ? "default" : "outline"}
                        size="sm"
                        onClick={() => onViewModeChange("month")}
                    >
                        {translations.monthView}
                    </Button>
                </div>
            </div>
            <h2 className="text-xl font-semibold text-center lg:text-left lg:ml-4">
                {viewMode === "week"
                    ? (() => {
                          const weekStart = startDate
                          const weekEnd = new Date(startDate)
                          weekEnd.setDate(weekEnd.getDate() + 6)
                          const startStr = `${weekStart.toLocaleDateString(dateLocale, { month: "short" })} ${weekStart.getDate()}`
                          const endStr = `${weekEnd.toLocaleDateString(dateLocale, { month: "short" })} ${weekEnd.getDate()}`
                          return `${startStr} - ${endStr}`
                      })()
                    : currentDate.toLocaleDateString(dateLocale, {
                          month: "long",
                          year: "numeric",
                      })}
            </h2>
            <div className="hidden lg:flex gap-2">
                <Button
                    variant={viewMode === "week" ? "default" : "outline"}
                    size="sm"
                    onClick={() => onViewModeChange("week")}
                >
                    {translations.weekView}
                </Button>
                <Button
                    variant={viewMode === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => onViewModeChange("month")}
                >
                    {translations.monthView}
                </Button>
            </div>
        </div>
    )
}
