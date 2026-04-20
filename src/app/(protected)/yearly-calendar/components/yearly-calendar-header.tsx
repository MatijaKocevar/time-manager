"use client"

import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useYearlyCalendarStore } from "../stores/yearly-calendar-store"
import { formatBalance, getBalanceColor } from "@/lib/balance-helpers"

interface YearlyCalendarHeaderProps {
    translations: {
        title: string
        year: string
    }
    yearlyBalance: number
}

export function YearlyCalendarHeader({ translations, yearlyBalance }: YearlyCalendarHeaderProps) {
    const selectedYear = useYearlyCalendarStore((state) => state.selectedYear)
    const setSelectedYear = useYearlyCalendarStore((state) => state.setSelectedYear)
    const goToPreviousYear = useYearlyCalendarStore((state) => state.goToPreviousYear)
    const goToNextYear = useYearlyCalendarStore((state) => state.goToNextYear)

    const years = Array.from({ length: 31 }, (_, i) => 2020 + i)

    return (
        <div className="flex items-center justify-between gap-3 shrink-0">
            <div id="yearly-nav-controls" className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToPreviousYear}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToNextYear}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Select
                    value={String(selectedYear)}
                    onValueChange={(value) => setSelectedYear(Number(value))}
                >
                    <SelectTrigger className="w-32">
                        <SelectValue placeholder={translations.year} />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map((year) => (
                            <SelectItem key={year} value={String(year)}>
                                {year}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div id="yearly-balance" className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                    Total Balance:
                </span>
                <span className={`text-lg font-bold ${getBalanceColor(yearlyBalance)}`}>
                    {formatBalance(yearlyBalance)}
                </span>
            </div>
        </div>
    )
}
