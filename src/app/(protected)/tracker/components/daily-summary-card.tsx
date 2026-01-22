"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"
import { useDailySummary } from "../hooks/use-daily-summary"
import { formatHoursMinutes } from "@/app/(protected)/hours/utils/time-helpers"
import { useTimeSheetsStore } from "@/app/(protected)/time-sheets/stores/time-sheets-store"
import type { HourType } from "@/../../prisma/generated/client"

interface DailySummaryCardProps {
    initialData: {
        totals: Record<"WORK" | "BREAK" | "PRIVATE", number>
        activeTimer: {
            id: string
            startTime: Date
            type: HourType
        } | null
    }
    translations: {
        title: string
        work: string
        break: string
        private: string
    }
}

export function DailySummaryCard({ initialData, translations }: DailySummaryCardProps) {
    const { totals } = useDailySummary(initialData)
    const openDayEntriesDialog = useTimeSheetsStore((state) => state.openDayEntriesDialog)

    const handleTypeClick = (type: "WORK" | "BREAK" | "PRIVATE") => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        openDayEntriesDialog(today.toISOString(), type)
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
                    <div
                        className="flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors"
                        onClick={() => handleTypeClick("WORK")}
                    >
                        <span className="text-sm text-muted-foreground font-medium">
                            {translations.work}
                        </span>
                        <span className="text-2xl font-bold tabular-nums">
                            {formatHoursMinutes(totals.WORK)}
                        </span>
                    </div>
                    <div
                        className="flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors"
                        onClick={() => handleTypeClick("BREAK")}
                    >
                        <span className="text-sm text-muted-foreground font-medium">
                            {translations.break}
                        </span>
                        <span className="text-2xl font-bold tabular-nums">
                            {formatHoursMinutes(totals.BREAK)}
                        </span>
                    </div>
                    <div
                        className="flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors"
                        onClick={() => handleTypeClick("PRIVATE")}
                    >
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
