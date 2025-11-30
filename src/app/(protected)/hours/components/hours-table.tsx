"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Edit, Trash2 } from "lucide-react"
import { deleteHourEntry, updateHourEntry } from "../actions/hour-actions"
import { useHoursStore } from "../stores/hours-store"
import type { HourEntryDisplay } from "../schemas/hour-entry-schemas"

const HOUR_TYPES = [
    { value: "WORK", label: "Work" },
    { value: "WORK_FROM_HOME", label: "Work From Home" },
    { value: "VACATION", label: "Vacation" },
    { value: "SICK_LEAVE", label: "Sick Leave" },
    { value: "OTHER", label: "Other" },
]

type ViewMode = "WEEKLY" | "MONTHLY"

interface HoursTableProps {
    entries: HourEntryDisplay[]
    viewMode: ViewMode
    startDate: string
    endDate: string
}

export function HoursTable({ entries, startDate, endDate }: HoursTableProps) {
    const router = useRouter()
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const editFormData = useHoursStore((state) => state.editForm.data)
    const isEditLoading = useHoursStore((state) => state.editForm.isLoading)
    const editError = useHoursStore((state) => state.editForm.error)
    const initializeEditForm = useHoursStore((state) => state.initializeEditForm)
    const setEditFormData = useHoursStore((state) => state.setEditFormData)
    const resetEditForm = useHoursStore((state) => state.resetEditForm)
    const setEditLoading = useHoursStore((state) => state.setEditLoading)
    const setEditError = useHoursStore((state) => state.setEditError)

    const generateDateColumns = () => {
        const [startYear, startMonth, startDay] = startDate.split("-").map(Number)
        const [endYear, endMonth, endDay] = endDate.split("-").map(Number)

        const start = new Date(startYear, startMonth - 1, startDay)
        const end = new Date(endYear, endMonth - 1, endDay)
        const dates = []
        const current = new Date(start)

        while (current <= end) {
            dates.push(new Date(current))
            current.setDate(current.getDate() + 1)
        }

        return dates
    }

    const groupEntriesByType = () => {
        const grouped: Record<string, Record<string, HourEntryDisplay>> = {}

        entries.forEach((entry) => {
            let dateKey: string
            if (entry.date instanceof Date) {
                const year = entry.date.getFullYear()
                const month = String(entry.date.getMonth() + 1).padStart(2, "0")
                const day = String(entry.date.getDate()).padStart(2, "0")
                dateKey = `${year}-${month}-${day}`
            } else {
                dateKey = entry.date
            }
            if (!grouped[entry.type]) {
                grouped[entry.type] = {}
            }
            grouped[entry.type][dateKey] = entry
        })

        return grouped
    }

    const handleEditClick = (entry: HourEntryDisplay) => {
        let dateStr: string
        if (entry.date instanceof Date) {
            const year = entry.date.getFullYear()
            const month = String(entry.date.getMonth() + 1).padStart(2, "0")
            const day = String(entry.date.getDate()).padStart(2, "0")
            dateStr = `${year}-${month}-${day}`
        } else {
            dateStr = entry.date
        }
        initializeEditForm({
            id: entry.id,
            date: dateStr,
            hours: entry.hours,
            type: entry.type,
            description: entry.description || "",
        })
        setIsEditDialogOpen(true)
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editFormData) return

        setEditLoading(true)
        setEditError("")

        const result = await updateHourEntry({
            id: editFormData.id,
            date: editFormData.date,
            hours: editFormData.hours,
            type: editFormData.type,
            description: editFormData.description || undefined,
        })

        if (result.error) {
            setEditError(result.error)
            setEditLoading(false)
        } else {
            setIsEditDialogOpen(false)
            resetEditForm()
            setEditLoading(false)
            router.refresh()
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this entry?")) return

        const result = await deleteHourEntry({ id })
        if (result.error) {
            alert(result.error)
        } else {
            router.refresh()
        }
    }

    const getTypeLabel = (type: string) => {
        return HOUR_TYPES.find((t) => t.value === type)?.label || type
    }

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            WORK: "bg-blue-100 text-blue-800",
            VACATION: "bg-green-100 text-green-800",
            SICK_LEAVE: "bg-red-100 text-red-800",
            WORK_FROM_HOME: "bg-purple-100 text-purple-800",
            OTHER: "bg-gray-100 text-gray-800",
        }
        return colors[type] || colors.OTHER
    }

    const renderWeeklyOrMonthlyView = () => {
        const dates = generateDateColumns()
        const groupedEntries = groupEntriesByType()
        const allTypes = HOUR_TYPES.map((t) => t.value)

        return (
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[100px] sticky left-0 bg-background z-10">
                                Type
                            </TableHead>
                            {dates.map((date) => {
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6
                                return (
                                    <TableHead
                                        key={date.toISOString()}
                                        className={`text-center min-w-20 ${isWeekend ? "bg-muted/50" : ""}`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-xs font-normal text-muted-foreground">
                                                {date.toLocaleDateString("en-US", {
                                                    weekday: "short",
                                                })}
                                            </span>
                                            <span>{date.getDate()}</span>
                                        </div>
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allTypes.map((type) => (
                            <TableRow key={type}>
                                <TableCell className="font-medium sticky left-0 bg-background z-10">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getTypeColor(type)}`}
                                    >
                                        {getTypeLabel(type)}
                                    </span>
                                </TableCell>
                                {dates.map((date) => {
                                    const year = date.getFullYear()
                                    const month = String(date.getMonth() + 1).padStart(2, "0")
                                    const day = String(date.getDate()).padStart(2, "0")
                                    const dateKey = `${year}-${month}-${day}`
                                    const entry = groupedEntries[type]?.[dateKey]
                                    const isWeekend = date.getDay() === 0 || date.getDay() === 6

                                    return (
                                        <TableCell
                                            key={dateKey}
                                            className={`text-center p-2 ${isWeekend ? "bg-muted/50" : ""}`}
                                        >
                                            {entry ? (
                                                <div className="flex flex-col items-center group relative">
                                                    <span className="font-semibold">
                                                        {entry.hours}
                                                    </span>
                                                    {entry.description && (
                                                        <span className="text-xs text-muted-foreground truncate max-w-[60px]">
                                                            {entry.description}
                                                        </span>
                                                    )}
                                                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                            onClick={() => handleEditClick(entry)}
                                                        >
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                            onClick={() => handleDelete(entry.id)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    }

    return (
        <>
            {renderWeeklyOrMonthlyView()}

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Hour Entry</DialogTitle>
                    </DialogHeader>
                    {editFormData && (
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            {editError && (
                                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                                    {editError}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="edit-date">Date</Label>
                                <Input
                                    id="edit-date"
                                    type="date"
                                    value={editFormData.date}
                                    onChange={(e) => setEditFormData({ date: e.target.value })}
                                    required
                                    disabled={isEditLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-hours">Hours</Label>
                                <Input
                                    id="edit-hours"
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    max="24"
                                    value={editFormData.hours}
                                    onChange={(e) =>
                                        setEditFormData({ hours: parseFloat(e.target.value) })
                                    }
                                    required
                                    disabled={isEditLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-type">Type</Label>
                                <Select
                                    value={editFormData.type}
                                    onValueChange={(value: string) =>
                                        setEditFormData({
                                            type: value as
                                                | "WORK"
                                                | "VACATION"
                                                | "SICK_LEAVE"
                                                | "WORK_FROM_HOME"
                                                | "OTHER",
                                        })
                                    }
                                    disabled={isEditLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {HOUR_TYPES.map((hourType) => (
                                            <SelectItem key={hourType.value} value={hourType.value}>
                                                {hourType.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-description">Description (Optional)</Label>
                                <Input
                                    id="edit-description"
                                    value={editFormData.description}
                                    onChange={(e) =>
                                        setEditFormData({ description: e.target.value })
                                    }
                                    placeholder="Add notes about this entry..."
                                    disabled={isEditLoading}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditDialogOpen(false)
                                        resetEditForm()
                                    }}
                                    disabled={isEditLoading}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isEditLoading}>
                                    {isEditLoading ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
