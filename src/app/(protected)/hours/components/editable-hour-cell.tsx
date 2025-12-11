"use client"

import { useEffect, useRef, useState } from "react"
import type { HourEntryDisplay } from "../schemas/hour-entry-schemas"
import { createHourEntry, updateHourEntry } from "../actions/hour-actions"
import { useEditableCellStore } from "../stores/editable-cell-store"

interface EditableHourCellProps {
    entry: HourEntryDisplay | undefined
    dateKey: string
    type: string
    onUpdate: () => void
}

export function EditableHourCell({ entry, dateKey, type, onUpdate }: EditableHourCellProps) {
    const cellKey = `${dateKey}-${type}`
    const activeCellKey = useEditableCellStore((state) => state.activeCellKey)
    const isLoading = useEditableCellStore((state) => state.isLoading)
    const setActiveCellKey = useEditableCellStore((state) => state.setActiveCellKey)
    const setLoading = useEditableCellStore((state) => state.setLoading)
    const inputRef = useRef<HTMLInputElement>(null)

    const [timeInput, setTimeInput] = useState("")

    const isEditing = activeCellKey === cellKey

    useEffect(() => {
        if (isEditing) {
            const currentHours = entry?.hours || 0
            const h = Math.floor(currentHours)
            const m = Math.round((currentHours - h) * 60)
            setTimeInput(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`)
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [isEditing, entry?.hours])

    const saveHours = async (hours: number) => {
        if (isNaN(hours) || hours < 0) {
            return
        }

        if (entry && hours === entry.hours) {
            setActiveCellKey(null)
            return
        }

        setLoading(true)

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
            setActiveCellKey(null)
        } finally {
            setLoading(false)
        }
    }

    const parseTimeInput = (input: string): { hours: number; minutes: number } | null => {
        if (!input || input === "") {
            return null
        }

        const parts = input.split(":")
        if (parts.length !== 2) {
            return null
        }

        const hours = parseInt(parts[0])
        const minutes = parseInt(parts[1])

        if (isNaN(hours) || isNaN(minutes)) {
            return null
        }

        if (hours < 0 || hours > 24 || minutes < 0 || minutes > 59) {
            return null
        }

        if (hours === 24 && minutes > 0) {
            return null
        }

        return { hours, minutes }
    }

    const handleBlur = async () => {
        const parsed = parseTimeInput(timeInput)
        if (parsed) {
            const totalHours = parsed.hours + parsed.minutes / 60
            await saveHours(totalHours)
        } else {
            setActiveCellKey(null)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault()
            inputRef.current?.blur()
        } else if (e.key === "Escape") {
            setActiveCellKey(null)
        }
    }

    const handleClick = () => {
        setActiveCellKey(cellKey)
    }

    const formatHoursToTime = (hours: number): string => {
        const h = Math.floor(hours)
        const m = Math.round((hours - h) * 60)
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
    }

    if (entry?.taskId) {
        const isTotal = entry.taskId === "total"
        const isGrandTotal = entry.taskId === "grand_total"
        const hours = entry?.hours || 0

        return (
            <div
                className={`h-8 w-16 text-center flex items-center justify-center rounded mx-auto ${
                    isTotal || isGrandTotal ? "font-bold" : "font-normal"
                } ${hours === 0 ? "text-muted-foreground" : "text-foreground"}`}
            >
                {hours === 0 ? "-" : formatHoursToTime(hours)}
            </div>
        )
    }

    const hours = entry?.hours || 0
    const displayValue = hours === 0 ? "-" : formatHoursToTime(hours)

    if (isEditing) {
        return (
            <div className="flex flex-col items-center gap-1 mx-auto w-20">
                <input
                    ref={inputRef}
                    type="time"
                    step="60"
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    className="h-8 w-full px-1 text-sm text-center border rounded"
                />
                {entry?.description && (
                    <span className="text-xs text-muted-foreground truncate max-w-[60px]">
                        {entry.description}
                    </span>
                )}
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center gap-1 mx-auto w-20">
            <div
                onClick={handleClick}
                className={`h-8 w-16 text-center flex items-center justify-center cursor-pointer hover:bg-accent hover:text-accent-foreground rounded font-normal border border-transparent hover:border-border transition-colors ${
                    hours === 0 ? "text-muted-foreground" : "text-foreground"
                }`}
            >
                {displayValue}
            </div>
            {entry?.description && (
                <span className="text-xs text-muted-foreground truncate max-w-[60px]">
                    {entry.description}
                </span>
            )}
        </div>
    )
}
