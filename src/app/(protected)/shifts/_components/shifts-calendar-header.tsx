"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
        viewLabel: string
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
    const title =
        viewMode === "week"
            ? (() => {
                  const weekEnd = new Date(startDate)
                  weekEnd.setDate(weekEnd.getDate() + 6)
                  const startStr = `${startDate.toLocaleDateString(dateLocale, { month: "short" })} ${startDate.getDate()}`
                  const endStr = `${weekEnd.toLocaleDateString(dateLocale, { month: "short" })} ${weekEnd.getDate()}`
                  return `${startStr} - ${endStr}`
              })()
            : currentDate.toLocaleDateString(dateLocale, { month: "long", year: "numeric" })

    return (
        <div className="flex items-center justify-between shrink-0">
            <div id="shifts-nav-controls" className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={onPrevious}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="font-semibold whitespace-nowrap">{title}</div>
                <Button variant="outline" size="icon" onClick={onNext}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="text-xs px-2" onClick={onToday}>
                    {translations.today}
                </Button>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{translations.viewLabel}</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                        value={viewMode}
                        onValueChange={(v) => onViewModeChange(v as "week" | "month")}
                    >
                        <DropdownMenuRadioItem value="week">
                            {translations.weekView}
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="month">
                            {translations.monthView}
                        </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
