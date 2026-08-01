"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DateTimePicker } from "@/components/ui/datetime-picker"
import { format } from "date-fns"
import { WorkTypeBadge } from "@/components/work-type-badge"
import { useCreateRequestStore } from "../_stores/create-request-store"
import { createUrnikNetRequest } from "../_actions/create-urnik-net-request-action"
import type { WorkType } from "@/lib/work-type-styles"

interface CreateRequestFormProps {
    dateLabel: string
    startTimeLabel: string
    endTimeLabel: string
    commentLabel: string
    submitButton: string
    successMessage: string
    errorPrefix: string
    retryButton: string
}

export function CreateRequestForm({
    dateLabel,
    startTimeLabel,
    endTimeLabel,
    commentLabel,
    submitButton,
    successMessage,
    errorPrefix,
    retryButton,
}: CreateRequestFormProps) {
    const selectedType = useCreateRequestStore((state) => state.selectedType)
    const isSubmitting = useCreateRequestStore((state) => state.isSubmitting)
    const error = useCreateRequestStore((state) => state.error)
    const setSubmitting = useCreateRequestStore((state) => state.setSubmitting)
    const setError = useCreateRequestStore((state) => state.setError)
    const setSuccess = useCreateRequestStore((state) => state.setSuccess)
    const closeDialog = useCreateRequestStore((state) => state.closeDialog)

    const [startDateTime, setStartDateTime] = useState<Date | undefined>(
        (() => {
            const d = new Date()
            d.setHours(9, 0, 0, 0)
            return d
        })()
    )
    const [endDateTime, setEndDateTime] = useState<Date | undefined>(
        (() => {
            const d = new Date()
            d.setHours(17, 0, 0, 0)
            return d
        })()
    )
    const [comment, setComment] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedType || !startDateTime || !endDateTime) return

        setSubmitting(true)
        setError(null)

        const result = await createUrnikNetRequest({
            type: selectedType as "WORK" | "WORK_FROM_HOME",
            date: startDateTime,
            startTime: format(startDateTime, "HH:mm"),
            endTime: format(endDateTime, "HH:mm"),
            comment: comment || undefined,
        })

        if (result.success) {
            toast.success(successMessage)
            setSuccess(successMessage)
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

    const calculateHours = () => {
        if (!startDateTime || !endDateTime) return "0.00"
        const diffMs = endDateTime.getTime() - startDateTime.getTime()
        return (diffMs / (1000 * 60 * 60)).toFixed(2)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="flex items-center gap-2 pb-2 border-b">
                <span className="text-sm text-muted-foreground">Request type:</span>
                <WorkTypeBadge type={selectedType as unknown as WorkType}>
                    {selectedType === "WORK" ? "Work" : "Work from home"}
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
                    >
                        {retryButton}
                    </Button>
                </div>
            )}

            <div className="space-y-2">
                <Label>{dateLabel}</Label>
                <DateTimePicker
                    value={startDateTime}
                    onChange={setStartDateTime}
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
                    onChange={setEndDateTime}
                    modal={true}
                    hideTime={false}
                    timePicker={{ hour: true, minute: true, second: false }}
                    disabled={isSubmitting}
                />
            </div>

            <div className="text-sm text-muted-foreground">Total hours: {calculateHours()}h</div>

            <div className="space-y-2">
                <Label htmlFor="comment">{commentLabel}</Label>
                <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={commentLabel}
                    disabled={isSubmitting}
                    rows={3}
                />
            </div>

            <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSubmitting || !startDateTime || !endDateTime}>
                    {isSubmitting ? "Submitting..." : submitButton}
                </Button>
            </div>
        </form>
    )
}
