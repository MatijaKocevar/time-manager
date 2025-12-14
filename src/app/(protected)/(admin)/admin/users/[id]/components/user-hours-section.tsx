"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { HoursSummary } from "@/app/(protected)/hours/components/hours-summary"
import { getHourEntriesForUser } from "@/app/(protected)/hours/actions/hour-actions"
import { getDateRange, getViewTitle } from "@/app/(protected)/hours/utils/view-helpers"
import { userHourKeys } from "../../query-keys"

interface UserHoursSectionProps {
    userId: string
    initialEntries: Awaited<ReturnType<typeof getHourEntriesForUser>>
}

export function UserHoursSection({ userId, initialEntries }: UserHoursSectionProps) {
    const [currentDate, setCurrentDate] = useState(new Date())

    const { startDate, endDate, start, end } = getDateRange("MONTHLY", currentDate)
    const monthTitle = getViewTitle("MONTHLY", { start, end }, currentDate)

    const { data: entries = initialEntries, isLoading } = useQuery({
        queryKey: userHourKeys.detail(userId, startDate),
        queryFn: () => getHourEntriesForUser(userId, startDate, endDate),
        initialData: initialEntries,
    })

    const handleNavigate = (direction: "prev" | "next") => {
        const newDate = new Date(currentDate)
        newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
        setCurrentDate(newDate)
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Hours Summary</CardTitle>
                        <CardDescription>Overview of user&apos;s tracked hours</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleNavigate("prev")}
                            disabled={isLoading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="min-w-[200px] text-center font-medium">{monthTitle}</div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleNavigate("next")}
                            disabled={isLoading}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <HoursSummary
                    entries={entries}
                    viewMode="MONTHLY"
                    weeklyEntries={[]}
                    monthlyEntries={entries}
                    isLoading={isLoading}
                />
            </CardContent>
        </Card>
    )
}
