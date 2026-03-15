"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { WorkTypeBadge } from "@/components/work-type-badge"
import { useCreateRequestStore } from "../stores/create-request-store"
import { createUrnikNetDayRequest } from "../actions/create-urnik-net-day-request-action"
import type { UrnikDayRequestType } from "../schemas/create-urnik-net-day-request-schema"
import type { WorkType } from "@/lib/work-type-styles"
import { calculateWorkDays } from "../../utils/date-helpers"

interface CreateDayRequestFormProps {
    startDateLabel: string
    endDateLabel: string
    workDaysLabel: string
    commentLabel: string
    submitButton: string
    successMessage: string
    errorPrefix: string
    retryButton: string
    typeVacation: string
    typeSickLeave: string
    typeWorkFromHome: string
}

export function CreateDayRequestForm({
    startDateLabel,
    endDateLabel,
    workDaysLabel,
    commentLabel,
    submitButton,
    successMessage,
    errorPrefix,
    retryButton,
    typeVacation,
    typeSickLeave,
    typeWorkFromHome,
}: CreateDayRequestFormProps) {
    const selectedType = useCreateRequestStore(
        (state) => state.selectedType
    ) as UrnikDayRequestType | null
    const isSubmitting = useCreateRequestStore((state) => state.isSubmitting)
    const error = useCreateRequestStore((state) => state.error)
    const setSubmitting = useCreateRequestStore((state) => state.setSubmitting)
    const setError = useCreateRequestStore((state) => state.setError)
    const closeDialog = useCreateRequestStore((state) => state.closeDialog)

    const [startDate, setStartDate] = useState<Date>()
    const [endDate, setEndDate] = useState<Date>()
    const [comment, setComment] = useState("")

    const workDays =
        startDate && endDate && endDate >= startDate ? calculateWorkDays(startDate, endDate) : null

    const typeLabels: Record<UrnikDayRequestType, string> = {
        VACATION: typeVacation,
        SICK_LEAVE: typeSickLeave,
        WORK_FROM_HOME: typeWorkFromHome,
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedType || !startDate || !endDate) return

        setSubmitting(true)
        setError(null)

        const result = await createUrnikNetDayRequest({
            type: selectedType,
            startDate,
            endDate,
            comment: comment || undefined,
        })

        if (result.success) {
            toast.success(successMessage)
            setTimeout(() => {
                closeDialog()
            }, 1500)
        } else {
            setError(result.error || "Unknown error")
            toast.error(`${errorPrefix} ${result.error}`)
        }

        setSubmitting(false)
    }

    const handleRetry = () => {
        handleSubmit(new Event("submit") as unknown as React.FormEvent)
    }

    if (!selectedType) {
        return null
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="flex items-center gap-2 pb-2 border-b">
                <span className="text-sm text-muted-foreground">Request type:</span>
                <WorkTypeBadge type={selectedType as unknown as WorkType}>
                    {typeLabels[selectedType]}
                </WorkTypeBadge>
            </div>

            {error && (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-md flex items-center justify-between">
                    <span>{error}</span>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                        disabled={isSubmitting}
                        className="ml-2 shrink-0"
                    >
                        {retryButton}
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>{startDateLabel}</Label>
                    <DatePicker
                        date={startDate}
                        onDateChange={setStartDate}
                        placeholder={startDateLabel}
                    />
                </div>
                <div className="space-y-2">
                    <Label>{endDateLabel}</Label>
                    <DatePicker
                        date={endDate}
                        onDateChange={setEndDate}
                        placeholder={endDateLabel}
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{workDaysLabel}:</span>
                <span className="font-medium">{workDays ?? "-"}</span>
            </div>

            <div className="space-y-2">
                <Label htmlFor="day-comment">{commentLabel}</Label>
                <Textarea
                    id="day-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                />
            </div>

            <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !startDate || !endDate}
            >
                {isSubmitting ? "..." : submitButton}
            </Button>
        </form>
    )
}
