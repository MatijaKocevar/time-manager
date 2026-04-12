"use client"

import { useTranslations } from "next-intl"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { useHoursStore } from "../stores/hours-store"
import { bulkCreateHourEntries } from "../actions/hour-actions"
import { MAX_HOURS_PER_DAY } from "../constants/hour-types"
import { hourKeys } from "../query-keys"
import { format } from "date-fns"

interface HourEntryFormProps {
    onSuccess?: () => void
}

export function HourEntryForm({ onSuccess }: HourEntryFormProps) {
    const t = useTranslations("hours.form")
    const tCommon = useTranslations("common")
    const tTypes = useTranslations("hours.types")
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
            !bulkEntryForm.data.hours
        ) {
            return
        }

        setBulkEntryLoading(true)
        setBulkEntryError("")

        const result = await bulkCreateHourEntries({
            startDate: bulkEntryForm.data.startDate,
            endDate: bulkEntryForm.data.endDate,
            hours: bulkEntryForm.data.hours,
            skipWeekends: bulkEntryForm.data.skipWeekends,
            skipHolidays: bulkEntryForm.data.skipHolidays,
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
                    <Label htmlFor="start-date">{tCommon("fields.startDate")}</Label>
                    <DatePicker
                        date={
                            bulkEntryForm.data.startDate
                                ? new Date(bulkEntryForm.data.startDate)
                                : undefined
                        }
                        onDateChange={(date) =>
                            setBulkEntryFormData({
                                startDate: date ? format(date, "yyyy-MM-dd") : "",
                            })
                        }
                        placeholder={t("selectStartDate")}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="end-date">{tCommon("fields.endDate")}</Label>
                    <DatePicker
                        date={
                            bulkEntryForm.data.endDate
                                ? new Date(bulkEntryForm.data.endDate)
                                : undefined
                        }
                        onDateChange={(date) =>
                            setBulkEntryFormData({
                                endDate: date ? format(date, "yyyy-MM-dd") : "",
                            })
                        }
                        placeholder={t("selectEndDate")}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="hours">{t("hoursPerDay")}</Label>
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

            <div className="flex items-center space-x-2">
                <input
                    id="skip-weekends"
                    type="checkbox"
                    checked={bulkEntryForm.data.skipWeekends}
                    onChange={(e) => setBulkEntryFormData({ skipWeekends: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="skip-weekends" className="cursor-pointer">
                    {t("skipWeekends")}
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
                    {t("skipHolidays")}
                </Label>
            </div>

            {bulkEntryForm.error && (
                <div className="text-sm text-red-500">{bulkEntryForm.error}</div>
            )}

            <Button type="submit" disabled={bulkEntryForm.isLoading} className="w-full">
                {bulkEntryForm.isLoading ? tCommon("status.creating") : t("addHours")}
            </Button>
        </form>
    )
}
