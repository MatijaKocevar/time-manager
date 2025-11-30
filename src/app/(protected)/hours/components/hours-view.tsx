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

type ViewMode = "WEEKLY" | "MONTHLY"

interface HoursViewProps {
    initialEntries: HourEntryDisplay[]
    initialMode: ViewMode
}

function getDateRange(mode: ViewMode, referenceDate: Date = new Date()) {
    const start = new Date(referenceDate)
    const end = new Date(referenceDate)

    switch (mode) {
        case "WEEKLY":
            const dayOfWeek = start.getDay()
            const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
            start.setDate(start.getDate() - daysToMonday)
            end.setDate(start.getDate() + 6)
            break
        case "MONTHLY":
            start.setDate(1)
            end.setMonth(end.getMonth() + 1, 0)
            break
    }

    const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
    }

    return {
        start,
        end,
        startDate: formatDate(start),
        endDate: formatDate(end),
    }
}

export function HoursView({ initialEntries, initialMode }: HoursViewProps) {
    const [viewMode, setViewMode] = useState<ViewMode>(initialMode)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [isFormOpen, setIsFormOpen] = useState(false)

    const dateRange = getDateRange(viewMode, currentDate)
    const monthRange = getDateRange("MONTHLY", new Date())

    const { data: entries = [], isLoading } = useQuery({
        queryKey: ["hours", dateRange.startDate, dateRange.endDate],
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
        queryKey: ["hours-monthly", monthRange.startDate, monthRange.endDate],
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

    const getTitle = () => {
        if (viewMode === "WEEKLY") {
            const start = dateRange.start
            const end = dateRange.end
            return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        } else {
            return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
        }
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
                        <h2 className="text-xl font-semibold min-w-0 text-center">{getTitle()}</h2>
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
                    {isLoading && (
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20">
                            <span className="text-muted-foreground">Loading...</span>
                        </div>
                    )}
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
