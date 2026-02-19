"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"
import { parseDateStringAsLocal } from "@/lib/utils"
import { REQUEST_TYPES, REQUEST_TYPE } from "../../requests/constants"
import type { RequestType } from "../../requests/schemas/request-schemas"
import { getRequestTypeTranslationKey } from "../../requests/utils/translation-helpers"

interface RequestFormState {
    type: RequestType | ""
    startDate: string
    endDate: string
    startTime: string
    endTime: string
    isFullDay: boolean
    requestedHours: number | null
    reason: string
    location: string
    skipWeekends: boolean
    skipHolidays: boolean
}

interface RequestFormDialogProps {
    isOpen: boolean
    onClose: () => void
    formData: RequestFormState
    onFormDataChange: (data: Partial<RequestFormState>) => void
    onSubmit: (e: React.FormEvent) => void
    isPending: boolean
    error: string | null
    requestedHours: number | null
    translations: {
        newRequest: string
        selectType: string
        selectStartDate: string
        selectEndDate: string
        fullDay: string
        startTime: string
        endTime: string
        requestedHours: string
        hours: string
        skipWeekends: string
        skipHolidays: string
        enterLocation: string
        enterReason: string
        reasonOptional: string
        submitRequest: string
        submitting: string
        type: string
        startDateLabel: string
        endDateLabel: string
        location: string
    }
    requestTypesTranslations: Record<string, string>
}

export function RequestFormDialog({
    isOpen,
    onClose,
    formData,
    onFormDataChange,
    onSubmit,
    isPending,
    error,
    requestedHours,
    translations,
    requestTypesTranslations,
}: RequestFormDialogProps) {
    const needsLocation = formData.type === REQUEST_TYPE.WORK_FROM_HOME

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[85vh] flex flex-col gap-0 p-0 sm:p-6 max-w-lg">
                <DialogHeader className="flex-shrink-0 pb-4 px-6 pt-6 sm:px-0 sm:pt-0">
                    <DialogTitle>{translations.newRequest}</DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="space-y-6 overflow-y-auto px-6 sm:px-0">
                        <div className="space-y-2">
                            <Label htmlFor="type">{translations.type}</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) =>
                                    onFormDataChange({ type: value as RequestType })
                                }
                            >
                                <SelectTrigger id="type">
                                    <SelectValue placeholder={translations.selectType} />
                                </SelectTrigger>
                                <SelectContent>
                                    {REQUEST_TYPES.map((rt) => (
                                        <SelectItem key={rt.value} value={rt.value}>
                                            {requestTypesTranslations[
                                                getRequestTypeTranslationKey(rt.value)
                                            ] || rt.value}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">{translations.startDateLabel}</Label>
                                <DatePicker
                                    date={
                                        formData.startDate
                                            ? parseDateStringAsLocal(formData.startDate)
                                            : undefined
                                    }
                                    onDateChange={(date) =>
                                        onFormDataChange({
                                            startDate: date ? format(date, "yyyy-MM-dd") : "",
                                        })
                                    }
                                    placeholder={translations.selectStartDate}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">{translations.endDateLabel}</Label>
                                <DatePicker
                                    date={
                                        formData.endDate
                                            ? parseDateStringAsLocal(formData.endDate)
                                            : undefined
                                    }
                                    onDateChange={(date) =>
                                        onFormDataChange({
                                            endDate: date ? format(date, "yyyy-MM-dd") : "",
                                        })
                                    }
                                    placeholder={translations.selectEndDate}
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="full-day"
                                checked={formData.isFullDay}
                                onCheckedChange={(checked) =>
                                    onFormDataChange({ isFullDay: checked === true })
                                }
                            />
                            <Label htmlFor="full-day" className="cursor-pointer font-normal">
                                {translations.fullDay}
                            </Label>
                        </div>

                        {!formData.isFullDay && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startTime">{translations.startTime}</Label>
                                    <Select
                                        value={formData.startTime}
                                        onValueChange={(value) =>
                                            onFormDataChange({ startTime: value })
                                        }
                                    >
                                        <SelectTrigger id="startTime">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 24 }, (_, i) => {
                                                const hour = i.toString().padStart(2, "0")
                                                return ["00", "15", "30", "45"].map((min) => {
                                                    const time = `${hour}:${min}`
                                                    return (
                                                        <SelectItem key={time} value={time}>
                                                            {time}
                                                        </SelectItem>
                                                    )
                                                })
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endTime">{translations.endTime}</Label>
                                    <Select
                                        value={formData.endTime}
                                        onValueChange={(value) =>
                                            onFormDataChange({ endTime: value })
                                        }
                                    >
                                        <SelectTrigger id="endTime">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 24 }, (_, i) => {
                                                const hour = i.toString().padStart(2, "0")
                                                return ["00", "15", "30", "45"].map((min) => {
                                                    const time = `${hour}:${min}`
                                                    return (
                                                        <SelectItem key={time} value={time}>
                                                            {time}
                                                        </SelectItem>
                                                    )
                                                })
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {requestedHours !== null && !formData.isFullDay && (
                            <div className="text-sm text-muted-foreground">
                                {translations.requestedHours}: {requestedHours.toFixed(2)}{" "}
                                {translations.hours}
                            </div>
                        )}

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="skip-weekends"
                                checked={formData.skipWeekends}
                                onCheckedChange={(checked) =>
                                    onFormDataChange({ skipWeekends: checked === true })
                                }
                            />
                            <Label htmlFor="skip-weekends" className="cursor-pointer font-normal">
                                {translations.skipWeekends}
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="skip-holidays"
                                checked={formData.skipHolidays}
                                onCheckedChange={(checked) =>
                                    onFormDataChange({ skipHolidays: checked === true })
                                }
                            />
                            <Label htmlFor="skip-holidays" className="cursor-pointer font-normal">
                                {translations.skipHolidays}
                            </Label>
                        </div>

                        {needsLocation && (
                            <div className="space-y-2">
                                <Label htmlFor="location">{translations.location}</Label>
                                <Input
                                    id="location"
                                    type="text"
                                    placeholder={translations.enterLocation}
                                    value={formData.location}
                                    onChange={(e) => onFormDataChange({ location: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="reason">{translations.reasonOptional}</Label>
                            <Input
                                id="reason"
                                type="text"
                                placeholder={translations.enterReason}
                                value={formData.reason}
                                onChange={(e) => onFormDataChange({ reason: e.target.value })}
                            />
                        </div>

                        {error && <div className="text-sm text-red-600">{error}</div>}
                    </div>

                    <div className="flex-shrink-0 pt-4 border-t px-6 pb-6 sm:px-0 sm:pb-0">
                        <Button type="submit" disabled={isPending}>
                            {isPending ? translations.submitting : translations.submitRequest}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
