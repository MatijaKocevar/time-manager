import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { HourEntryDisplay } from "../schemas/hour-entry-schemas"

interface HoursSummaryProps {
    entries: HourEntryDisplay[]
    isLoading?: boolean
}

export function HoursSummary({ entries, isLoading = false }: HoursSummaryProps) {
    const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0)

    const typeOrder = ["WORK", "WORK_FROM_HOME", "VACATION", "SICK_LEAVE", "OTHER"]

    const typeLabels: Record<string, string> = {
        WORK: "Work",
        VACATION: "Vacation",
        SICK_LEAVE: "Sick Leave",
        WORK_FROM_HOME: "Work From Home",
        OTHER: "Other",
    }

    const hoursByType = typeOrder.reduce(
        (acc, type) => {
            acc[type] = entries
                .filter((entry) => entry.type === type)
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
            {typeOrder.map((type) => (
                <Card key={type}>
                    <CardHeader className="pb-3">
                        <CardDescription>{typeLabels[type]}</CardDescription>
                        <CardTitle className="text-3xl">
                            {isLoading ? (
                                <Skeleton className="h-9 w-16" />
                            ) : (
                                hoursByType[type].toFixed(1)
                            )}
                        </CardTitle>
                    </CardHeader>
                </Card>
            ))}
        </div>
    )
}
