"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronLeft, ChevronRight, Plus, MoreVertical } from "lucide-react"
import { HoursTable } from "./hours-table"
import { HoursSummary } from "./hours-summary"
import { HourEntryForm } from "./bulk-hour-entry-form"
import { getHourEntries } from "../actions/hour-actions"
import type { HourEntryDisplay } from "../schemas/hour-entry-schemas"
import type { ViewMode } from "../schemas/hour-filter-schemas"
import { getDateRange, getViewTitle } from "../utils/view-helpers"
import { hourKeys } from "../query-keys"

interface HoursViewProps {
    initialEntries: HourEntryDisplay[]
    initialMode: ViewMode
}

export function HoursView({ initialEntries, initialMode }: HoursViewProps) {
    const [viewMode, setViewMode] = useState<ViewMode>(initialMode)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [isFormOpen, setIsFormOpen] = useState(false)

    const dateRange = getDateRange(viewMode, currentDate)
    const monthRange = getDateRange("MONTHLY", new Date())

    const { data: entries = [], isLoading } = useQuery({
        queryKey: hourKeys.list({ startDate: dateRange.startDate, endDate: dateRange.endDate }),
        queryFn: () => getHourEntries(dateRange.startDate, dateRange.endDate),
        initialData: () => {
            const initial = getDateRange(initialMode, new Date())
            if (
                initial.startDate === dateRange.startDate &&
                initial.endDate === dateRange.endDate
            ) {
                return initialEntries
            }
            return undefined
        },
    })

    const { data: monthlyEntries, isLoading: isLoadingMonthly } = useQuery({
        queryKey: hourKeys.monthlySummary(monthRange.startDate),
        queryFn: () => getHourEntries(monthRange.startDate, monthRange.endDate),
        initialData: () => {
            const currentMonth = getDateRange("MONTHLY", new Date())
            if (
                initialMode === "MONTHLY" &&
                currentMonth.startDate === monthRange.startDate &&
                currentMonth.endDate === monthRange.endDate
            ) {
                return initialEntries
            }
            return undefined
        },
    })

    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode)
        setCurrentDate(new Date())
    }

    const handleNavigate = (direction: "prev" | "next") => {
        const newDate = new Date(currentDate)

        if (viewMode === "WEEKLY") {
            newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
        } else {
            newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
        }

        setCurrentDate(newDate)
    }

    return (
        <>
            <HoursSummary entries={monthlyEntries || []} isLoading={isLoadingMonthly} />

            <div className="space-y-4">
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
                            {getViewTitle(viewMode, dateRange, currentDate)}
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
                        <Button
                            variant={viewMode === "WEEKLY" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleViewModeChange("WEEKLY")}
                            disabled={isLoading}
                        >
                            Week
                        </Button>
                        <Button
                            variant={viewMode === "MONTHLY" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleViewModeChange("MONTHLY")}
                            disabled={isLoading}
                        >
                            Month
                        </Button>
                        <div className="w-px h-6 bg-border mx-1" />
                        <Button variant="default" size="sm" onClick={() => setIsFormOpen(true)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add New Entry
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
                                    Week View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewModeChange("MONTHLY")}>
                                    Month View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsFormOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add New Entry
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
                    />
                </div>
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Hours</DialogTitle>
                    </DialogHeader>
                    <HourEntryForm onSuccess={() => setIsFormOpen(false)} />
                </DialogContent>
            </Dialog>
        </>
    )
}
