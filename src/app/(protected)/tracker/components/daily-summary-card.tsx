"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"
import { useDailySummary } from "../hooks/use-daily-summary"
import { formatHoursMinutes } from "@/app/(protected)/hours/utils/time-helpers"

interface DailySummaryCardProps {
    translations: {
        title: string
        work: string
        break: string
        private: string
    }
}

export function DailySummaryCard({ translations }: DailySummaryCardProps) {
    const { totals, isLoading } = useDailySummary()

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock className="h-5 w-5" />
                        {translations.title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5" />
                    {translations.title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-muted-foreground font-medium">
                            {translations.work}
                        </span>
                        <span className="text-2xl font-bold tabular-nums">
                            {formatHoursMinutes(totals.WORK)}
                        </span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-muted-foreground font-medium">
                            {translations.break}
                        </span>
                        <span className="text-2xl font-bold tabular-nums">
                            {formatHoursMinutes(totals.BREAK)}
                        </span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-muted-foreground font-medium">
                            {translations.private}
                        </span>
                        <span className="text-2xl font-bold tabular-nums">
                            {formatHoursMinutes(totals.PRIVATE)}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
