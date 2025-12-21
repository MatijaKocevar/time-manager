import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Holiday } from "../types"
import { formatHolidayDate } from "../utils"

interface UpcomingHolidaysProps {
    holidays: Holiday[]
    locale: string
    translations: {
        title: string
        description: string
        viewAll: (params: { count: number }) => string
    }
}

export function UpcomingHolidays({
    holidays,
    locale,
    translations,
}: UpcomingHolidaysProps) {
    if (holidays.length === 0) {
        return null
    }

    const displayedHolidays = holidays.slice(0, 5)

    return (
        <Card>
            <CardHeader>
                <CardTitle>{translations.title}</CardTitle>
                <CardDescription>{translations.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {displayedHolidays.map((holiday) => (
                        <div
                            key={holiday.id}
                            className="flex items-center justify-between space-x-4"
                        >
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {holiday.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatHolidayDate(holiday.date, locale)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                {holidays.length > 5 && (
                    <Button variant="outline" className="w-full mt-4" asChild>
                        <Link href="/admin/shifts">
                            {translations.viewAll({ count: holidays.length })}
                        </Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
