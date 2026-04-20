"use client"

import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslations, useLocale } from "next-intl"
import { useHoursStore } from "../stores/hours-store"
import { useHoursBatchStore } from "../stores/hours-batch-store"
import { useHoursNavigation } from "../hooks/use-hours-navigation"
import { useHoursData } from "../hooks/use-hours-data"
import { useHolidays } from "../hooks/use-holidays"
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronLeft, ChevronRight, Plus, MoreVertical, Save, X, Download } from "lucide-react"
import { HoursTable } from "./hours-table"
import { HoursSummary } from "./hours-summary"
import { HourEntryForm } from "./bulk-hour-entry-form"
import { exportHoursData } from "../actions/export-actions"
import { ExportDialog, type ExportFormat } from "@/features/export"
import type { HourEntryDisplay } from "../schemas/hour-entry-schemas"
import type { ViewMode } from "../schemas/hour-filter-schemas"
import { VIEW_MODE_VALUES } from "../schemas/hour-filter-schemas"
import { getViewTitle } from "../utils/view-helpers"
import { hourKeys } from "../query-keys"

interface HoursViewProps {
    initialEntries: HourEntryDisplay[]
    initialWeeklyEntries: HourEntryDisplay[]
    initialMonthlyEntries: HourEntryDisplay[]
    userId: string
    initialViewMode: ViewMode
    initialSelectedDate: Date
    initialHolidays?: Array<{ date: Date; name: string }>
    initialDateRange?: { start: Date; end: Date }
    initialSummaryCollapsed?: boolean
    initialAttendanceData?: { officeCount: number; remoteCount: number }
}

export function HoursView({
    initialEntries,
    initialWeeklyEntries,
    initialMonthlyEntries,
    userId,
    initialViewMode,
    initialSelectedDate,
    initialHolidays = [],
    initialSummaryCollapsed = false,
    initialAttendanceData,
}: HoursViewProps) {
    const t = useTranslations("hours.actions")
    const tCommon = useTranslations("common")
    const tForm = useTranslations("hours.form")
    const tViews = useTranslations("hours.views")
    const tMessages = useTranslations("hours.messages")
    const locale = useLocale()
    const queryClient = useQueryClient()
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)

    const { viewMode, currentDate, handleViewModeChange, handleNavigate, getCurrentMonth } =
        useHoursNavigation(initialViewMode, initialSelectedDate)

    const { entries, isLoading, weeklyEntries, monthlyEntries, dateRange, monthRange } =
        useHoursData(
            viewMode,
            currentDate,
            initialEntries,
            initialWeeklyEntries,
            initialMonthlyEntries
        )

    const holidays = useHolidays(monthRange.startDate, monthRange.endDate, initialHolidays)

    useEffect(() => {
        const hoursStore = useHoursStore.getState()
        if (initialSummaryCollapsed !== hoursStore.summaryCollapsed) {
            hoursStore.summaryCollapsed = initialSummaryCollapsed
        }
    }, [initialSummaryCollapsed])

    const isDirty = useHoursBatchStore((state) => state.isDirty)
    const isSaving = useHoursBatchStore((state) => state.isSaving)
    const changeCount = useHoursBatchStore((state) => state.getChangeCount())
    const clearChanges = useHoursBatchStore((state) => state.clearChanges)
    const saveChanges = useHoursBatchStore((state) => state.saveChanges)

    useUnsavedChangesWarning(isDirty, isSaving, tCommon("messages.unsavedChanges"))

    const handleSave = async () => {
        await saveChanges(async () => {
            await queryClient.invalidateQueries({ queryKey: hourKeys.all })
        })
    }

    const handleCancel = () => {
        if (confirm(tMessages("discardChanges"))) {
            clearChanges()
        }
    }

    const handleExport = async (format: ExportFormat, months: string[]) => {
        return await exportHoursData({ format, months })
    }

    return (
        <>
            <HoursSummary
                entries={entries}
                isLoading={isLoading}
                viewMode={viewMode}
                weeklyEntries={weeklyEntries}
                monthlyEntries={monthlyEntries}
                dateRange={monthRange}
                holidays={holidays}
                initialAttendanceData={initialAttendanceData}
            />

            <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between gap-2">
                    <div id="hours-nav" className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleNavigate("prev")}
                            disabled={isLoading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <h2 className="text-xl font-semibold min-w-0 text-center">
                            {getViewTitle(viewMode, dateRange, currentDate, locale)}
                        </h2>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleNavigate("next")}
                            disabled={isLoading}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                        {isDirty && (
                            <>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    <Save className="h-4 w-4 mr-1" />
                                    {t("saveWithCount", { count: changeCount })}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancel}
                                    disabled={isSaving}
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    {tCommon("actions.cancel")}
                                </Button>
                                <div className="w-px h-6 bg-border mx-1" />
                            </>
                        )}
                        <Button
                            variant={viewMode === VIEW_MODE_VALUES.WEEKLY ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleViewModeChange(VIEW_MODE_VALUES.WEEKLY)}
                            disabled={isLoading || isDirty}
                        >
                            {tCommon("time.week")}
                        </Button>
                        <Button
                            variant={viewMode === VIEW_MODE_VALUES.MONTHLY ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleViewModeChange(VIEW_MODE_VALUES.MONTHLY)}
                            disabled={isLoading || isDirty}
                        >
                            {tCommon("time.month")}
                        </Button>
                        <div className="w-px h-6 bg-border mx-1" />
                        <Button
                            id="hours-add-entry"
                            variant="default"
                            size="sm"
                            onClick={() => setIsFormOpen(true)}
                            disabled={isDirty}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            {t("addNewEntry")}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsExportDialogOpen(true)}
                            disabled={isDirty}
                        >
                            <Download className="h-4 w-4 mr-1" />
                            {tCommon("actions.export")}
                        </Button>
                    </div>
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => handleViewModeChange(VIEW_MODE_VALUES.WEEKLY)}
                                >
                                    {tViews("weekView")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleViewModeChange(VIEW_MODE_VALUES.MONTHLY)}
                                >
                                    {tViews("monthView")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsFormOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    {t("addNewEntry")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsExportDialogOpen(true)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    {tCommon("actions.export")}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                <div className="relative">
                    <HoursTable
                        entries={entries || []}
                        viewMode={viewMode}
                        startDate={dateRange.startDate}
                        endDate={dateRange.endDate}
                        userId={userId}
                        holidays={holidays}
                    />
                </div>
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{tForm("addHours")}</DialogTitle>
                    </DialogHeader>
                    <HourEntryForm onSuccess={() => setIsFormOpen(false)} />
                </DialogContent>
            </Dialog>

            <ExportDialog
                open={isExportDialogOpen}
                onOpenChange={setIsExportDialogOpen}
                defaultMonth={getCurrentMonth()}
                onExport={handleExport}
                filenamePrefix="hours"
            />
        </>
    )
}
