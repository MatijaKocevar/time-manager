"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"
import { HoursSummary } from "@/app/(protected)/hours/components/hours-summary"
import { getHourEntriesForUser } from "@/app/(protected)/hours/actions/hour-actions"
import { getDateRange, getViewTitle } from "@/app/(protected)/hours/utils/view-helpers"
import { getHolidaysInRange } from "@/app/(protected)/admin/holidays/actions/holiday-actions"
import { exportUserDetailsWithHours } from "../../actions/export-actions"
import { ExportDialog, type ExportFormat } from "@/features/export"
import { userHourKeys } from "../../query-keys"

interface UserHoursSectionProps {
    userId: string
    initialEntries: Awaited<ReturnType<typeof getHourEntriesForUser>>
    initialHolidays?: Array<{ date: Date }>
}

export function UserHoursSection({
    userId,
    initialEntries,
    initialHolidays = [],
}: UserHoursSectionProps) {
    const t = useTranslations("admin.users.detail")
    const tCommon = useTranslations("common.actions")
    const [currentDate, setCurrentDate] = useState(new Date())
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)

    const { startDate, endDate, start, end } = getDateRange("MONTHLY", currentDate)
    const monthTitle = getViewTitle("MONTHLY", { start, end }, currentDate)

    const { data: entries = initialEntries, isLoading } = useQuery({
        queryKey: userHourKeys.detail(userId, startDate),
        queryFn: () => getHourEntriesForUser(userId, startDate, endDate),
        initialData: initialEntries,
    })

    const { data: holidays = initialHolidays } = useQuery({
        queryKey: ["holidays", startDate, endDate],
        queryFn: () => getHolidaysInRange(startDate, endDate),
        initialData: initialHolidays,
    })

    const handleNavigate = (direction: "prev" | "next") => {
        const newDate = new Date(currentDate)
        newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
        setCurrentDate(newDate)
    }

    const handleExport = async (format: ExportFormat, months: string[]) => {
        return await exportUserDetailsWithHours({ format, months, userId })
    }

    const getCurrentMonth = () => {
        const year = currentDate.getFullYear()
        const month = String(currentDate.getMonth() + 1).padStart(2, "0")
        return `${year}-${month}`
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{t("hoursSummary")}</CardTitle>
                        <CardDescription>{t("hoursSummaryDescription")}</CardDescription>
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
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsExportDialogOpen(true)}
                        >
                            <Download className="h-4 w-4 mr-1" />
                            {tCommon("export")}
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
                    dateRange={{ start, end }}
                    holidays={holidays}
                />
            </CardContent>

            <ExportDialog
                open={isExportDialogOpen}
                onOpenChange={setIsExportDialogOpen}
                defaultMonth={getCurrentMonth()}
                onExport={handleExport}
                filenamePrefix={`user-${userId}-hours`}
            />
        </Card>
    )
}
