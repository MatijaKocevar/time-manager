"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"
import { HoursSummary } from "@/app/(protected)/hours/components/hours-summary"
import { HourTypeBreakdownDialog } from "@/app/(protected)/hours/components/hour-type-breakdown-dialog"
import { getHourEntriesForUser } from "@/app/(protected)/hours/actions/hour-actions"
import { getDateRange, getViewTitle } from "@/app/(protected)/hours/utils/view-helpers"
import { VIEW_MODE_VALUES } from "@/app/(protected)/hours/schemas/hour-filter-schemas"
import { getHolidaysInRange } from "@/app/(protected)/admin/holidays/actions/holiday-actions"
import { exportUserDetailsWithHours } from "../../actions/export-actions"
import { ExportDialog, type ExportFormat } from "@/features/export"
import { userHourKeys } from "../../query-keys"
import { useHoursStore } from "@/app/(protected)/hours/stores/hours-store"
import { TASK_ID_VALUES } from "@/app/(protected)/hours/constants/hour-types"
import type { HourEntryDisplay } from "@/app/(protected)/hours/schemas/hour-entry-schemas"

interface UserHoursSectionProps {
    userId: string
    user: { workHoursPerDay: number | null }
    initialEntries: Awaited<ReturnType<typeof getHourEntriesForUser>>
    initialHolidays?: Array<{ date: Date }>
    initialAttendanceData?: { officeCount: number; remoteCount: number }
}

export function UserHoursSection({
    userId,
    user,
    initialEntries,
    initialHolidays = [],
    initialAttendanceData,
}: UserHoursSectionProps) {
    const t = useTranslations("admin.users.detail")
    const tCommon = useTranslations("common.actions")
    const [currentDate, setCurrentDate] = useState(new Date())
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
    const openHourTypeDialog = useHoursStore((state) => state.openHourTypeDialog)

    const { startDate, endDate, start, end } = getDateRange(VIEW_MODE_VALUES.MONTHLY, currentDate)
    const monthTitle = getViewTitle(VIEW_MODE_VALUES.MONTHLY, { start, end }, currentDate)

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

    const prepareHourTypeData = useMemo(() => {
        return (type: string) => {
            const filteredEntries = entries.filter(
                (entry: HourEntryDisplay) =>
                    entry.type === type && entry.taskId === TASK_ID_VALUES.TOTAL
            )

            const entriesByDate = filteredEntries.reduce(
                (acc, entry) => {
                    const dateKey = entry.date.toISOString().split("T")[0]
                    if (!acc[dateKey]) {
                        acc[dateKey] = { date: entry.date, hours: 0 }
                    }
                    acc[dateKey].hours += entry.hours
                    return acc
                },
                {} as Record<string, { date: Date; hours: number }>
            )

            return Object.values(entriesByDate).filter((entry) => entry.hours > 0)
        }
    }, [entries])

    const handleHourTypeClick = (type: string) => {
        const data = prepareHourTypeData(type)
        openHourTypeDialog(type as any, data)
    }

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
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <CardTitle>{t("hoursSummary")}</CardTitle>
                            <CardDescription>{t("hoursSummaryDescription")}</CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsExportDialogOpen(true)}
                        >
                            <Download className="h-4 w-4 mr-1" />
                            {tCommon("export")}
                        </Button>
                    </div>
                    <div className="flex items-center justify-center gap-2">
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
                </CardHeader>
                <CardContent>
                    <HoursSummary
                        entries={entries}
                        viewMode={VIEW_MODE_VALUES.MONTHLY}
                        weeklyEntries={[]}
                        monthlyEntries={entries}
                        isLoading={isLoading}
                        dateRange={{ start, end }}
                        holidays={holidays}
                        userData={{ workHoursPerDay: user.workHoursPerDay || 8 }}
                        initialAttendanceData={initialAttendanceData}
                        onHourTypeClick={handleHourTypeClick}
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

            <HourTypeBreakdownDialog />
        </>
    )
}
