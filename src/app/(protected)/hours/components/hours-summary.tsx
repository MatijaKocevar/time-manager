import { Card, CardHeader } from "@/components/ui/card"
import type { HourEntryDisplay } from "../schemas/hour-entry-schemas"
import type { ViewMode } from "../schemas/hour-filter-schemas"
import { HOUR_TYPES, HOUR_TYPE_COLORS } from "../constants/hour-types"

function formatHoursMinutes(hours: number): string {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
}

interface HoursSummaryProps {
    entries: HourEntryDisplay[]
    isLoading?: boolean
    viewMode: ViewMode
    weeklyEntries: HourEntryDisplay[]
    monthlyEntries: HourEntryDisplay[]
}

export function HoursSummary({ weeklyEntries, monthlyEntries, viewMode }: HoursSummaryProps) {
    const weeklyGrandTotal = weeklyEntries
        .filter((entry) => entry.taskId === "grand_total")
        .reduce((sum, entry) => sum + entry.hours, 0)

    const monthlyGrandTotal = monthlyEntries
        .filter((entry) => entry.taskId === "grand_total")
        .reduce((sum, entry) => sum + entry.hours, 0)

    const weeklyTypeTotals = weeklyEntries.filter((entry) => entry.taskId === "total")
    const weeklyHoursByType = HOUR_TYPES.reduce(
        (acc, hourType) => {
            acc[hourType.value] = weeklyTypeTotals
                .filter((entry) => entry.type === hourType.value)
                .reduce((sum, entry) => sum + entry.hours, 0)
            return acc
        },
        {} as Record<string, number>
    )

    const monthlyTypeTotals = monthlyEntries.filter((entry) => entry.taskId === "total")
    const monthlyHoursByType = HOUR_TYPES.reduce(
        (acc, hourType) => {
            acc[hourType.value] = monthlyTypeTotals
                .filter((entry) => entry.type === hourType.value)
                .reduce((sum, entry) => sum + entry.hours, 0)
            return acc
        },
        {} as Record<string, number>
    )

    const showWeekly = viewMode === "WEEKLY"

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card>
                <CardHeader className="p-4 pb-2">
                    <div
                        className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${HOUR_TYPE_COLORS.GRAND_TOTAL}`}
                    >
                        Total Hours
                    </div>
                    {showWeekly ? (
                        <div className="flex flex-col gap-1 mt-2">
                            <div>
                                <div className="text-xs text-muted-foreground">Week</div>
                                <div className="text-xl font-bold">
                                    {formatHoursMinutes(weeklyGrandTotal)}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground">Month</div>
                                <div className="text-xl font-bold">
                                    {formatHoursMinutes(monthlyGrandTotal)}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-2xl font-bold mt-2">
                            {formatHoursMinutes(monthlyGrandTotal)}
                        </div>
                    )}
                </CardHeader>
            </Card>
            {HOUR_TYPES.map((hourType) => (
                <Card key={hourType.value}>
                    <CardHeader className="p-4 pb-2">
                        <div
                            className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${HOUR_TYPE_COLORS[hourType.value]}`}
                        >
                            {hourType.label}
                        </div>
                        {showWeekly ? (
                            <div className="flex flex-col gap-1 mt-2">
                                <div>
                                    <div className="text-xs text-muted-foreground">Week</div>
                                    <div className="text-lg font-semibold">
                                        {formatHoursMinutes(weeklyHoursByType[hourType.value])}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Month</div>
                                    <div className="text-lg font-semibold">
                                        {formatHoursMinutes(monthlyHoursByType[hourType.value])}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-xl font-semibold mt-2">
                                {formatHoursMinutes(monthlyHoursByType[hourType.value])}
                            </div>
                        )}
                    </CardHeader>
                </Card>
            ))}
        </div>
    )
}
