"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface WorkTimeAdjustmentProps {
    defaultStartTime?: string
    defaultEndTime?: string
}

export function WorkTimeAdjustment({ defaultStartTime, defaultEndTime }: WorkTimeAdjustmentProps) {
    const [startTime, setStartTime] = useState(defaultStartTime || "")
    const [endTime, setEndTime] = useState(defaultEndTime || "")
    const [isLoading, setIsLoading] = useState(false)

    const handleSave = async () => {
        setIsLoading(true)

        try {
            const response = await fetch("/api/adjust-work-time", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    adjustedStartTime: startTime || undefined,
                    adjustedEndTime: endTime || undefined,
                }),
            })

            const data = await response.json()

            if (response.ok) {
                toast.success("Work times adjusted for today")
            } else {
                toast.error(data.error || "Failed to adjust work times")
            }
        } catch {
            toast.error("An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    const handleClear = async () => {
        setIsLoading(true)

        try {
            const response = await fetch("/api/adjust-work-time", {
                method: "DELETE",
            })

            const data = await response.json()

            if (response.ok) {
                setStartTime(defaultStartTime || "")
                setEndTime(defaultEndTime || "")
                toast.success("Work time adjustments cleared")
            } else {
                toast.error(data.error || "Failed to clear adjustments")
            }
        } catch {
            toast.error("An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Temporary Work Time Adjustment</CardTitle>
                <CardDescription>
                    Adjust your work start and end times for today only. These changes will reset
                    tomorrow.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="temp-start-time">Start Time (Today)</Label>
                        <Input
                            id="temp-start-time"
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="temp-end-time">End Time (Today)</Label>
                        <Input
                            id="temp-end-time"
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? "Saving..." : "Apply for Today"}
                    </Button>
                    <Button onClick={handleClear} variant="outline" disabled={isLoading}>
                        Reset to Default
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
