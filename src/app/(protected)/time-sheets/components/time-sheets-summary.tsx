"use client"

import { Card, CardHeader } from "@/components/ui/card"

function formatHoursMinutes(hours: number): string {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
}

interface TimeSheetsSummaryProps {
    totalSeconds: number
    workingDays: number
    translations: {
        workingDays: string
        expected: string
        total: string
        overtime: string
    }
}

export function TimeSheetsSummary({
    totalSeconds,
    workingDays,
    translations,
}: TimeSheetsSummaryProps) {
    const totalHours = totalSeconds / 3600
    const expectedHours = workingDays * 8
    const overtime = totalHours - expectedHours

    if (workingDays === 0) return null

    return (
        <Card>
            <CardHeader className="p-4">
                <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6 text-sm">
                        <div>
                            <span className="text-muted-foreground">
                                {translations.workingDays}:{" "}
                            </span>
                            <span className="font-semibold">{workingDays}</span>
                        </div>
                        <div className="h-4 w-px bg-border" />
                        <div>
                            <span className="text-muted-foreground">
                                {translations.expected}:{" "}
                            </span>
                            <span className="font-semibold">
                                {formatHoursMinutes(expectedHours)}
                            </span>
                        </div>
                        <div className="h-4 w-px bg-border" />
                        <div>
                            <span className="text-muted-foreground">{translations.total}: </span>
                            <span className="font-semibold">
                                {formatHoursMinutes(totalHours)}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            {translations.overtime}:
                        </span>
                        <span
                            className={`text-lg font-bold ${
                                overtime > 0
                                    ? "text-red-600 dark:text-red-500"
                                    : overtime < 0
                                      ? "text-orange-600 dark:text-orange-500"
                                      : "text-green-600 dark:text-green-500"
                            }`}
                        >
                            {overtime > 0 && "+"}
                            {formatHoursMinutes(overtime)}
                        </span>
                    </div>
                </div>
            </CardHeader>
        </Card>
    )
}
