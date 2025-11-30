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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="pb-3">
                    <CardDescription>Total Hours</CardDescription>
                    <CardTitle className="text-3xl">
                        {isLoading ? <Skeleton className="h-9 w-16" /> : totalHours.toFixed(1)}
                    </CardTitle>
                </CardHeader>
            </Card>
            {HOUR_TYPES.map((hourType) => (
                <Card key={hourType.value}>
                    <CardHeader className="pb-3">
                        <CardDescription>{hourType.label}</CardDescription>
                        <CardTitle className="text-3xl">
                            {isLoading ? (
                                <Skeleton className="h-9 w-16" />
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
