"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { WorkTypeBadge } from "@/components/work-type-badge"
import { useCreateRequestStore } from "../stores/create-request-store"
import { createUrnikNetRequest } from "../actions/create-urnik-net-request-action"
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

    const [date, setDate] = useState<Date>()
    const [startTime, setStartTime] = useState("09:00")
    const [endTime, setEndTime] = useState("17:00")
    const [comment, setComment] = useState("")

    const timeOptions = Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, "0")
        return ["00", "15", "30", "45"].map((min) => `${hour}:${min}`)
    }).flat()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedType || !date) return

        setSubmitting(true)
        setError(null)

        const result = await createUrnikNetRequest({
            type: selectedType as "WORK" | "WORK_FROM_HOME",
            date,
            startTime,
            endTime,
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
        const [startHour, startMin] = startTime.split(":").map(Number)
        const [endHour, endMin] = endTime.split(":").map(Number)
        const startMinutes = startHour * 60 + startMin
        const endMinutes = endHour * 60 + endMin
        return ((endMinutes - startMinutes) / 60).toFixed(2)
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
                <Label htmlFor="date">{dateLabel}</Label>
                <DatePicker
                    date={date}
                    onDateChange={setDate}
                    placeholder={dateLabel}
                    disabled={isSubmitting}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="startTime">{startTimeLabel}</Label>
                    <Select value={startTime} onValueChange={setStartTime} disabled={isSubmitting}>
                        <SelectTrigger id="startTime">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                    {time}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="endTime">{endTimeLabel}</Label>
                    <Select value={endTime} onValueChange={setEndTime} disabled={isSubmitting}>
                        <SelectTrigger id="endTime">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                    {time}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
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
                <Button type="submit" disabled={isSubmitting || !date}>
                    {isSubmitting ? "Submitting..." : submitButton}
                </Button>
            </div>
        </form>
    )
}
