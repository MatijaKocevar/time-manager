"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations, useLocale } from "next-intl"
import { useHoursStore } from "../stores/hours-store"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronLeft, ChevronRight, Plus, MoreVertical, Save, X } from "lucide-react"
import { HoursTable } from "./hours-table"
import { HoursSummary } from "./hours-summary"
import { HourEntryForm } from "./bulk-hour-entry-form"
import { getHourEntries, batchUpdateHourEntries } from "../actions/hour-actions"
import type { HourEntryDisplay } from "../schemas/hour-entry-schemas"
import type { ViewMode } from "../schemas/hour-filter-schemas"
import { getDateRange, getViewTitle } from "../utils/view-helpers"
import { hourKeys } from "../query-keys"
import { useHoursBatchStore } from "../stores/hours-batch-store"

interface HoursViewProps {
    initialEntries: HourEntryDisplay[]
    initialWeeklyEntries: HourEntryDisplay[]
    initialMonthlyEntries: HourEntryDisplay[]
    userId: string
    initialViewMode: ViewMode
    initialSelectedDate: Date
    initialHolidays?: Array<{ date: Date; name: string }>
    initialDateRange?: { start: Date; end: Date }
    initialExpandedTypes?: string[]
}

export function HoursView({
    initialEntries,
    initialWeeklyEntries,
    initialMonthlyEntries,
    userId,
    initialViewMode,
    initialSelectedDate,
    initialHolidays = [],
    initialExpandedTypes = [],
}: HoursViewProps) {
    const t = useTranslations("hours.actions")
    const tCommon = useTranslations("common")
    const tForm = useTranslations("hours.form")
    const tViews = useTranslations("hours.views")
    const tMessages = useTranslations("hours.messages")
    const locale = useLocale()
    const router = useRouter()
    const queryClient = useQueryClient()
    const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode)
    const [currentDate, setCurrentDate] = useState<Date>(initialSelectedDate)
    const [isFormOpen, setIsFormOpen] = useState(false)

    useEffect(() => {
        const initializeExpandedTypes = useHoursStore.getState().initializeExpandedTypes
        initializeExpandedTypes(initialExpandedTypes)
    }, [])

    const isDirty = useHoursBatchStore((state) => state.isDirty)
    const isSaving = useHoursBatchStore((state) => state.isSaving)
    const changeCount = useHoursBatchStore((state) => state.pendingChanges.size)
    const clearChanges = useHoursBatchStore((state) => state.clearChanges)
    const setIsSaving = useHoursBatchStore((state) => state.setIsSaving)
    const setError = useHoursBatchStore((state) => state.setError)
    const getAllChanges = useHoursBatchStore((state) => state.getAllChanges)

    const handleSave = async () => {
        setIsSaving(true)
        setError(null)

        try {
            const pendingChanges = getAllChanges()
            console.log("Saving changes:", pendingChanges)

            const result = await batchUpdateHourEntries({
                changes: pendingChanges.map((c) => ({
                    entryId: c.entryId,
                    date: c.date,
                    type: c.type,
                    hours: c.hours,
                    action: c.action,
                })),
            })

            console.log("Save result:", result)

            if (result.error) {
                setError(result.error)
            } else {
                clearChanges()
                await queryClient.invalidateQueries({ queryKey: hourKeys.all })
            }
        } catch (error) {
            console.error("Save error:", error)
            setError(error instanceof Error ? error.message : "Failed to save changes")
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        if (confirm(tMessages("discardChanges"))) {
            clearChanges()
        }
    }

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault()
                e.returnValue = ""
            }
        }

        window.addEventListener("beforeunload", handleBeforeUnload)
        return () => window.removeEventListener("beforeunload", handleBeforeUnload)
    }, [isDirty])

    useEffect(() => {
        const handleRouteChange = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            const link = target.closest("a")

            if (link && isDirty && !isSaving) {
                const href = link.getAttribute("href")
                if (href && !href.startsWith("#") && href !== window.location.pathname) {
                    if (!confirm(tCommon("messages.unsavedChanges"))) {
                        e.preventDefault()
                        e.stopPropagation()
                    }
                }
            }
        }

        document.addEventListener("click", handleRouteChange, true)
        return () => document.removeEventListener("click", handleRouteChange, true)
    }, [isDirty, isSaving])

    const dateRange = getDateRange(viewMode, currentDate)
    const weekRange = getDateRange("WEEKLY", currentDate)
    const monthRange = getDateRange("MONTHLY", currentDate)

    const { data: entries = [], isLoading } = useQuery({
        queryKey: hourKeys.list({ startDate: dateRange.startDate, endDate: dateRange.endDate }),
        queryFn: () => getHourEntries(dateRange.startDate, dateRange.endDate),
        initialData: initialEntries,
        staleTime: 0,
    })

    const { data: weeklyEntries = [] } = useQuery({
        queryKey: hourKeys.list({ startDate: weekRange.startDate, endDate: weekRange.endDate }),
        queryFn: () => getHourEntries(weekRange.startDate, weekRange.endDate),
        initialData: initialWeeklyEntries,
        staleTime: 0,
    })

    const { data: monthlyEntries = [] } = useQuery({
        queryKey: hourKeys.list({ startDate: monthRange.startDate, endDate: monthRange.endDate }),
        queryFn: () => getHourEntries(monthRange.startDate, monthRange.endDate),
        initialData: initialMonthlyEntries,
        staleTime: 0,
    })

    const { data: holidays = initialHolidays } = useQuery({
        queryKey: ["holidays", monthRange.startDate, monthRange.endDate],
        queryFn: async () => {
            const { getHolidaysInRange } =
                await import("../../admin/holidays/actions/holiday-actions")
            return getHolidaysInRange(monthRange.startDate, monthRange.endDate)
        },
        initialData: initialHolidays,
        staleTime: 300000,
    })

    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode)
        setCurrentDate(new Date())
        router.push(`/hours?view=${mode.toLowerCase()}`)
    }

    const handleNavigate = (direction: "prev" | "next") => {
        const newDate = new Date(currentDate)

        if (viewMode === "WEEKLY") {
            newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
        } else {
            newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
        }

        setCurrentDate(newDate)
        const dateStr = newDate.toISOString().split("T")[0]
        router.push(`/hours?view=${viewMode.toLowerCase()}&date=${dateStr}`)
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
            />

            <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
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
                            variant={viewMode === "WEEKLY" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleViewModeChange("WEEKLY")}
                            disabled={isLoading || isDirty}
                        >
                            {tCommon("time.week")}
                        </Button>
                        <Button
                            variant={viewMode === "MONTHLY" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleViewModeChange("MONTHLY")}
                            disabled={isLoading || isDirty}
                        >
                            {tCommon("time.month")}
                        </Button>
                        <div className="w-px h-6 bg-border mx-1" />
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => setIsFormOpen(true)}
                            disabled={isDirty}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            {t("addNewEntry")}
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
                                <DropdownMenuItem onClick={() => handleViewModeChange("WEEKLY")}>
                                    {tViews("weekView")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewModeChange("MONTHLY")}>
                                    {tViews("monthView")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsFormOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    {t("addNewEntry")}
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
                        initialExpandedTypes={initialExpandedTypes}
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
        </>
    )
}
