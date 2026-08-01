"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"
import { HoursSummary } from "@/app/(protected)/hours/_components/hours-summary"
import { HourTypeBreakdownDialog } from "@/app/(protected)/hours/_components/hour-type-breakdown-dialog"
import { VIEW_MODE_VALUES } from "@/app/(protected)/hours/_schemas/hour-filter-schemas"
import { ExportDialog } from "@/features/export"
import { useUserHoursSection } from "../_hooks/use-user-hours-section"
import type { HourEntryDisplay } from "@/app/(protected)/hours/_schemas/hour-entry-schemas"

interface UserHoursSectionClientProps {
    userId: string
    workHoursPerDay: number | null
    initialEntries: HourEntryDisplay[]
    initialHolidays: Array<{ date: Date }>
    initialAttendanceData?: { officeCount: number; remoteCount: number }
    translations: {
        title: string
        description: string
        exportLabel: string
    }
}

export function UserHoursSectionClient({
    userId,
    workHoursPerDay,
    initialEntries,
    initialHolidays,
    initialAttendanceData,
    translations,
}: UserHoursSectionClientProps) {
    const {
        entries,
        holidays,
        isLoading,
        isExportDialogOpen,
        monthTitle,
        dateRange,
        currentMonth,
        setIsExportDialogOpen,
        handleNavigate,
        handleHourTypeClick,
        handleExport,
    } = useUserHoursSection({ userId, initialEntries, initialHolidays })

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle>{translations.title}</CardTitle>
                            <CardDescription>{translations.description}</CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleNavigate("prev")}
                                disabled={isLoading}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="min-w-[140px] text-center font-medium">
                                {monthTitle}
                            </div>
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
                                <Download className="h-4 w-4 lg:mr-1" />
                                <span className="hidden lg:inline">{translations.exportLabel}</span>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <HoursSummary
                        entries={entries}
                        viewMode={VIEW_MODE_VALUES.MONTHLY}
                        weeklyEntries={[]}
                        monthlyEntries={entries}
                        isLoading={isLoading}
                        dateRange={dateRange}
                        holidays={holidays}
                        userData={{ workHoursPerDay: workHoursPerDay ?? 8 }}
                        initialAttendanceData={initialAttendanceData}
                        onHourTypeClick={handleHourTypeClick}
                    />
                </CardContent>

                <ExportDialog
                    open={isExportDialogOpen}
                    onOpenChange={setIsExportDialogOpen}
                    defaultMonth={currentMonth}
                    onExport={handleExport}
                    filenamePrefix={`user-${userId}-hours`}
                />
            </Card>

            <HourTypeBreakdownDialog />
        </>
    )
}
