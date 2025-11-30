"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import type { HourEntryDisplay } from "../schemas/hour-entry-schemas"
import { createHourEntry, updateHourEntry } from "../actions/hour-actions"

interface EditableHourCellProps {
    entry: HourEntryDisplay | undefined
    dateKey: string
    type: string
    onUpdate: () => void
}

export function EditableHourCell({ entry, dateKey, type, onUpdate }: EditableHourCellProps) {
    const [value, setValue] = useState(entry?.hours?.toString() || "")
    const [isSaving, setIsSaving] = useState(false)
    const [showPicker, setShowPicker] = useState(false)
    const [selectedHours, setSelectedHours] = useState(0)
    const [selectedMinutes, setSelectedMinutes] = useState(0)
    const pickerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setValue(entry?.hours?.toString() || "")
        if (entry?.hours) {
            const h = Math.floor(entry.hours)
            const m = Math.round((entry.hours - h) * 60)
            setSelectedHours(h)
            setSelectedMinutes(m)
        }
    }, [entry?.hours])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setShowPicker(false)
            }
        }

        if (showPicker) {
            document.addEventListener("mousedown", handleClickOutside)
            return () => document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [showPicker])

    const saveHours = async (hours: number) => {
        if (isNaN(hours) || hours < 0) {
            return
        }

        if (entry && hours === entry.hours) {
            return
        }

        setIsSaving(true)

        try {
            if (entry) {
                await updateHourEntry({
                    id: entry.id,
                    date: dateKey,
                    hours,
                    type: entry.type,
                    description: entry.description || undefined,
                })
            } else {
                await createHourEntry({
                    date: dateKey,
                    hours,
                    type: type as "WORK" | "VACATION" | "SICK_LEAVE" | "WORK_FROM_HOME" | "OTHER",
                    description: undefined,
                })
            }
            onUpdate()
        } catch {
            setValue(entry?.hours?.toString() || "")
        } finally {
            setIsSaving(false)
        }
    }

    const handleConfirm = async () => {
        const totalHours = selectedHours + selectedMinutes / 60
        setValue(totalHours.toString())
        setShowPicker(false)
        await saveHours(totalHours)
    }

    const formatHoursToTime = (hours: number): string => {
        const h = Math.floor(hours)
        const m = Math.round((hours - h) * 60)
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
    }

    if (entry?.taskId) {
        const isTotal = entry.taskId === "total"
        return (
            <div
                className={`h-8 w-16 text-center flex items-center justify-center text-muted-foreground bg-muted/30 rounded mx-auto ${isTotal ? "font-bold" : "font-normal"}`}
            >
                {entry?.hours ? formatHoursToTime(entry.hours) : "00:00"}
            </div>
        )
    }

    const displayValue = value ? formatHoursToTime(parseFloat(value)) : ""

    return (
        <div className="flex flex-col items-center gap-1 mx-auto relative">
            <div
                onClick={() => setShowPicker(true)}
                className="h-8 w-16 text-center flex items-center justify-center cursor-pointer hover:bg-muted/50 rounded font-normal text-muted-foreground"
            >
                {displayValue || "00:00"}
            </div>
            {entry?.description && (
                <span className="text-xs text-muted-foreground truncate max-w-[60px]">
                    {entry.description}
                </span>
            )}

            {showPicker && (
                <div
                    ref={pickerRef}
                    className="absolute top-full mt-1 z-50 bg-popover border rounded-md shadow-lg p-3 w-fit"
                >
                    <div className="flex gap-2 items-center">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground">Hours</label>
                            <select
                                value={selectedHours}
                                onChange={(e) => setSelectedHours(parseInt(e.target.value))}
                                className="h-8 px-2 border rounded text-sm"
                            >
                                {Array.from({ length: 25 }, (_, i) => (
                                    <option key={i} value={i}>
                                        {i.toString().padStart(2, "0")}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <span className="text-lg mt-5">:</span>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground">Minutes</label>
                            <select
                                value={selectedMinutes}
                                onChange={(e) => setSelectedMinutes(parseInt(e.target.value))}
                                className="h-8 px-2 border rounded text-sm"
                            >
                                {Array.from({ length: 60 }, (_, i) => (
                                    <option key={i} value={i}>
                                        {i.toString().padStart(2, "0")}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <Button
                            size="sm"
                            onClick={handleConfirm}
                            disabled={isSaving}
                            className="flex-1"
                        >
                            OK
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowPicker(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
