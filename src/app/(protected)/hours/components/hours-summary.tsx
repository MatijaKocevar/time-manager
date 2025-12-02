import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { HourEntryDisplay } from "../schemas/hour-entry-schemas"
import { HOUR_TYPES } from "../constants/hour-types"

interface HoursSummaryProps {
    entries: HourEntryDisplay[]
    isLoading?: boolean
}

export function HoursSummary({ entries, isLoading = false }: HoursSummaryProps) {
    const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0)

    const hoursByType = HOUR_TYPES.reduce(
        (acc, hourType) => {
            acc[hourType.value] = entries
                .filter((entry) => entry.type === hourType.value)
                .reduce((sum, entry) => sum + entry.hours, 0)
            return acc
        },
        {} as Record<string, number>
    )

    return (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <Card>
                <CardHeader className="p-4 pb-2">
                    <CardDescription className="text-xs">Total Hours</CardDescription>
                    <CardTitle className="text-2xl">
                        {isLoading ? <Skeleton className="h-7 w-12" /> : totalHours.toFixed(1)}
                    </CardTitle>
                </CardHeader>
            </Card>
            {HOUR_TYPES.map((hourType) => (
                <Card key={hourType.value}>
                    <CardHeader className="p-4 pb-2">
                        <CardDescription className="text-xs">{hourType.label}</CardDescription>
                        <CardTitle className="text-2xl">
                            {isLoading ? (
                                <Skeleton className="h-7 w-12" />
                            ) : (
                                hoursByType[hourType.value].toFixed(1)
                            )}
                        </CardTitle>
                    </CardHeader>
                </Card>
            ))}
        </div>
    )
}
