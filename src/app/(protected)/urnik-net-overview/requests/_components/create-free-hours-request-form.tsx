"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { WorkTypeBadge } from "@/components/work-type-badge"
import { useCreateRequestStore } from "../_stores/create-request-store"
import { createUrnikNetFreeRequest } from "../_actions/create-urnik-net-free-request-action"

interface CreateFreeHoursRequestFormProps {
    dateLabel: string
    startTimeLabel: string
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
    startTimeLabel,
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

    const [date, setDate] = useState<Date>()
    const [startTime, setStartTime] = useState("08:00")
    const [endTime, setEndTime] = useState("12:00")
    const [comment, setComment] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!date || endTime <= startTime) return

        setSubmitting(true)
        setError(null)

        const result = await createUrnikNetFreeRequest({
            date,
            startTime,
            endTime,
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
                <DatePicker date={date} onDateChange={setDate} placeholder={dateLabel} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="free-start-time">{startTimeLabel}</Label>
                    <Input
                        id="free-start-time"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="free-end-time">{endTimeLabel}</Label>
                    <Input
                        id="free-end-time"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>
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
                disabled={isSubmitting || !date || endTime <= startTime}
            >
                {isSubmitting ? "..." : submitButton}
            </Button>
        </form>
    )
}
