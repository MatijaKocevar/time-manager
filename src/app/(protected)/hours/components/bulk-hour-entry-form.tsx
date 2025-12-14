"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useHoursStore } from "../stores/hours-store"
import { bulkCreateHourEntries } from "../actions/hour-actions"
import { HOUR_TYPES, MAX_HOURS_PER_DAY } from "../constants/hour-types"
import { hourKeys } from "../query-keys"

interface HourEntryFormProps {
    onSuccess?: () => void
}

export function HourEntryForm({ onSuccess }: HourEntryFormProps) {
    const queryClient = useQueryClient()
    const bulkEntryForm = useHoursStore((state) => state.bulkEntryForm)
    const setBulkEntryFormData = useHoursStore((state) => state.setBulkEntryFormData)
    const setBulkEntryLoading = useHoursStore((state) => state.setBulkEntryLoading)
    const setBulkEntryError = useHoursStore((state) => state.setBulkEntryError)
    const resetBulkEntryForm = useHoursStore((state) => state.resetBulkEntryForm)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (
            !bulkEntryForm.data.startDate ||
            !bulkEntryForm.data.endDate ||
            !bulkEntryForm.data.hours ||
            !bulkEntryForm.data.type
        ) {
            return
        }

        setBulkEntryLoading(true)
        setBulkEntryError("")

        const result = await bulkCreateHourEntries({
            startDate: bulkEntryForm.data.startDate,
            endDate: bulkEntryForm.data.endDate,
            hours: bulkEntryForm.data.hours,
            type: bulkEntryForm.data.type,
            description: bulkEntryForm.data.description || undefined,
            skipWeekends: bulkEntryForm.data.skipWeekends,
        })

        if (result.error) {
            setBulkEntryLoading(false)
            setBulkEntryError(result.error)
            return
        }

        resetBulkEntryForm()
        queryClient.invalidateQueries({ queryKey: hourKeys.all })
        onSuccess?.()
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                        id="start-date"
                        type="date"
                        value={bulkEntryForm.data.startDate}
                        onChange={(e) => setBulkEntryFormData({ startDate: e.target.value })}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                        id="end-date"
                        type="date"
                        value={bulkEntryForm.data.endDate}
                        onChange={(e) => setBulkEntryFormData({ endDate: e.target.value })}
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="hours">Hours per Day</Label>
                <Input
                    id="hours"
                    type="number"
                    step="0.5"
                    min="0.5"
                    max={MAX_HOURS_PER_DAY}
                    value={bulkEntryForm.data.hours || ""}
                    onChange={(e) => setBulkEntryFormData({ hours: parseFloat(e.target.value) })}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                    value={bulkEntryForm.data.type}
                    onValueChange={(value) =>
                        setBulkEntryFormData({
                            type: value as
                                | "WORK"
                                | "VACATION"
                                | "SICK_LEAVE"
                                | "WORK_FROM_HOME"
                                | "OTHER",
                        })
                    }
                >
                    <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
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
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                    id="description"
                    type="text"
                    value={bulkEntryForm.data.description || ""}
                    onChange={(e) => setBulkEntryFormData({ description: e.target.value })}
                    placeholder="Add a note..."
                />
            </div>

            <div className="flex items-center space-x-2">
                <input
                    id="skip-weekends"
                    type="checkbox"
                    checked={bulkEntryForm.data.skipWeekends}
                    onChange={(e) => setBulkEntryFormData({ skipWeekends: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="skip-weekends" className="cursor-pointer">
                    Skip weekends
                </Label>
            </div>

            <div className="flex items-center space-x-2">
                <input
                    id="skip-holidays"
                    type="checkbox"
                    checked={bulkEntryForm.data.skipHolidays ?? true}
                    onChange={(e) => setBulkEntryFormData({ skipHolidays: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="skip-holidays" className="cursor-pointer">
                    Skip holidays
                </Label>
            </div>

            {bulkEntryForm.error && (
                <div className="text-sm text-red-500">{bulkEntryForm.error}</div>
            )}

            <Button type="submit" disabled={bulkEntryForm.isLoading} className="w-full">
                {bulkEntryForm.isLoading ? "Creating..." : "Add Hours"}
            </Button>
        </form>
    )
}
