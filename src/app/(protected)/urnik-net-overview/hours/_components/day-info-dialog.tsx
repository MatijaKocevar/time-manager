"use client"

import { useState, useEffect, useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import type { DayDetailData } from "../_schemas/hours-schema"
import { fetchDayDetail } from "../_actions/hours-actions"

interface DayInfoDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    date: string
    dayOfWeek: string
    year: number
    month: number
    graphColors: string[] | null
    translations: {
        title: string
        start: string
        end: string
        duration: string
        type: string
        workWithoutBreak: string
        lunchBreak: string
        withBreak: string
        loading: string
        error: string
    }
}

export function DayInfoDialog({
    open,
    onOpenChange,
    date,
    dayOfWeek,
    year,
    month,
    graphColors,
    translations,
}: DayInfoDialogProps) {
    const [data, setData] = useState<DayDetailData | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        if (!open || !date) {
            return
        }
        const parts = date.split(".")
        const day = parseInt(parts[0])
        if (!day) {
            return
        }

        startTransition(async () => {
            try {
                const result = await fetchDayDetail(year, month, day)
                if (result.success && result.data) {
                    setData(result.data)
                } else {
                    setError(result.error ?? translations.error)
                }
            } catch {
                setError(translations.error)
            }
        })
    }, [open, date, year, month, translations.error])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {translations.title} — {date} ({dayOfWeek})
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 pt-2">
                    {graphColors && (
                        <div className="flex items-center gap-[1px]">
                            {graphColors.map((color, i) => {
                                const isWhite = /^#(fff|ffffff)$/i.test(color) || color === "white"
                                return (
                                    <span
                                        key={i}
                                        className={`inline-block h-2 w-[5px] ${isWhite ? "border border-gray-300 dark:border-gray-500" : ""}`}
                                        style={{ backgroundColor: color }}
                                    />
                                )
                            })}
                        </div>
                    )}

                    {isPending && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    {data && !isPending && (
                        <>
                            <div className="rounded-md border min-w-0">
                                <div className="grid grid-cols-[1fr_1fr_0.5fr_0.7fr] gap-2 p-2 text-sm font-medium text-muted-foreground border-b bg-muted/50">
                                    <span>{translations.start}</span>
                                    <span>{translations.end}</span>
                                    <span>{translations.duration}</span>
                                    <span>{translations.type}</span>
                                </div>
                                {data.entries.map((entry, i) => (
                                    <div
                                        key={i}
                                        className="grid grid-cols-[1fr_1fr_0.5fr_0.7fr] gap-2 p-2 text-sm border-b last:border-b-0"
                                    >
                                        <span className="truncate">{entry.start}</span>
                                        <span className="truncate">{entry.end}</span>
                                        <span>{entry.duration}</span>
                                        <span className="truncate">{entry.type}</span>
                                    </div>
                                ))}
                            </div>

                            {(data.workWithoutBreak || data.lunchBreak || data.withBreak) && (
                                <div className="text-sm space-y-1">
                                    {data.workWithoutBreak && (
                                        <p>
                                            <span className="font-medium">
                                                {translations.workWithoutBreak}:
                                            </span>{" "}
                                            {data.workWithoutBreak}
                                        </p>
                                    )}
                                    {data.lunchBreak && (
                                        <p>
                                            <span className="font-medium">
                                                {translations.lunchBreak}:
                                            </span>{" "}
                                            {data.lunchBreak}
                                        </p>
                                    )}
                                    {data.withBreak && (
                                        <p>
                                            <span className="font-medium">
                                                {translations.withBreak}:
                                            </span>{" "}
                                            {data.withBreak}
                                        </p>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
