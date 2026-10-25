"use client"

import { useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DateTimePicker } from "@/components/ui/datetime-picker"
import { WorkTypeBadge } from "@/components/work-type-badge"
import { useCreateRequestStore } from "../_stores/create-request-store"
import { createUrnikNetFreeRequest } from "../_actions/create-urnik-net-free-request-action"

interface CreateFreeHoursRequestFormProps {
    dateLabel: string
    endTimeLabel: string
    commentLabel: string
    submitButton: string
    successMessage: string
    errorPrefix: string
    retryButton: string
    typeFreeHours: string
}

export function CreateFreeHoursRequestForm({
    dateLabel,
    endTimeLabel,
    commentLabel,
    submitButton,
    successMessage,
    errorPrefix,
    retryButton,
    typeFreeHours,
}: CreateFreeHoursRequestFormProps) {
    const isSubmitting = useCreateRequestStore((state) => state.isSubmitting)
    const error = useCreateRequestStore((state) => state.error)
    const setSubmitting = useCreateRequestStore((state) => state.setSubmitting)
    const setError = useCreateRequestStore((state) => state.setError)
    const closeDialog = useCreateRequestStore((state) => state.closeDialog)

    const [startDateTime, setStartDateTime] = useState<Date | undefined>(() => {
        const date = new Date()
        date.setHours(8, 0, 0, 0)
        return date
    })
    const [endDateTime, setEndDateTime] = useState<Date | undefined>(() => {
        const date = new Date()
        date.setHours(12, 0, 0, 0)
        return date
    })
    const [comment, setComment] = useState("")

    const handleStartDateTimeChange = (date: Date | undefined) => {
        setStartDateTime(date)

        if (!date) return

        setEndDateTime((current) => {
            if (!current) return current

            return new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
                current.getHours(),
                current.getMinutes()
            )
        })
    }

    const handleEndDateTimeChange = (date: Date | undefined) => {
        if (!date) {
            setEndDateTime(undefined)
            return
        }

        const base = startDateTime ?? date

        setEndDateTime(
            new Date(
                base.getFullYear(),
                base.getMonth(),
                base.getDate(),
                date.getHours(),
                date.getMinutes()
            )
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!startDateTime || !endDateTime || endDateTime <= startDateTime) return

        setSubmitting(true)
        setError(null)

        const requestDate = new Date(startDateTime)
        requestDate.setHours(0, 0, 0, 0)

        const result = await createUrnikNetFreeRequest({
            date: requestDate,
            startTime: format(startDateTime, "HH:mm"),
            endTime: format(endDateTime, "HH:mm"),
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

    return (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="flex items-center gap-2 pb-2 border-b">
                <span className="text-sm text-muted-foreground">Request type:</span>
                <WorkTypeBadge type="OVERTIME_USE">{typeFreeHours}</WorkTypeBadge>
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

            <div className="space-y-2">
                <Label>{dateLabel}</Label>
                <DateTimePicker
                    value={startDateTime}
                    onChange={handleStartDateTimeChange}
                    modal={true}
                    hideTime={false}
                    timePicker={{ hour: true, minute: true, second: false }}
                    disabled={isSubmitting}
                />
            </div>

            <div className="space-y-2">
                <Label>{endTimeLabel}</Label>
                <DateTimePicker
                    value={endDateTime}
                    onChange={handleEndDateTimeChange}
                    modal={true}
                    hideTime={false}
                    timePicker={{ hour: true, minute: true, second: false }}
                    disabled={isSubmitting}
                    min={startDateTime}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="free-comment">{commentLabel}</Label>
                <Textarea
                    id="free-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    disabled={isSubmitting}
                />
            </div>

            <Button
                type="submit"
                className="w-full"
                disabled={
                    isSubmitting || !startDateTime || !endDateTime || endDateTime <= startDateTime
                }
            >
                {isSubmitting ? "..." : submitButton}
            </Button>
        </form>
    )
}
