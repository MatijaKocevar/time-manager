"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
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

    useEffect(() => {
        setValue(entry?.hours?.toString() || "")
    }, [entry?.hours])

    const handleBlur = async () => {
        const hours = parseFloat(value)

        if (!value || isNaN(hours) || hours <= 0) {
            setValue(entry?.hours?.toString() || "")
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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.currentTarget.blur()
        }
    }

    return (
        <div className="flex flex-col items-center gap-1">
            <Input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                disabled={isSaving}
                className="h-8 w-16 text-center font-semibold border-0"
                placeholder="0"
            />
            {entry?.description && (
                <span className="text-xs text-muted-foreground truncate max-w-[60px]">
                    {entry.description}
                </span>
            )}
        </div>
    )
}
