import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface MonthNavigationProps {
    currentYear: number
    currentMonth: number
    monthName: string
    translations: {
        previousMonth: string
        nextMonth: string
    }
}

export function MonthNavigation({
    currentYear,
    currentMonth,
    monthName,
    translations,
}: MonthNavigationProps) {
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear

    return (
        <div className="flex items-center justify-between">
            <Link href={`/urnik-net-overview/hours?year=${previousYear}&month=${previousMonth}`}>
                <Button variant="outline" size="sm">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    {translations.previousMonth}
                </Button>
            </Link>

            <h2 className="text-xl font-semibold">
                {monthName} {currentYear}
            </h2>

            <Link href={`/urnik-net-overview/hours?year=${nextYear}&month=${nextMonth}`}>
                <Button variant="outline" size="sm">
                    {translations.nextMonth}
                    <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
            </Link>
        </div>
    )
}
