"use client"

import { useState } from "react"
import type { HourType } from "@/../../prisma/generated/client"
import type { HourEntryDisplay } from "../schemas/hour-entry-schemas"
import { useEditableCellStore } from "../stores/editable-cell-store"
import { useHoursBatchStore } from "../stores/hours-batch-store"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface EditableHourCellProps {
    date: Date
    type: HourType
    entry: HourEntryDisplay | null
    userId: string
    showProgressBar?: boolean
}

export function EditableHourCell({
    date,
    type,
    entry,
    userId,
    showProgressBar = false,
}: EditableHourCellProps) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const dateKey = `${year}-${month}-${day}`
    const cellKey = `${dateKey}-${type}`
    const activeCellKey = useEditableCellStore((state) => state.activeCellKey)
    const setActiveCellKey = useEditableCellStore((state) => state.setActiveCellKey)
    const getPendingChange = useHoursBatchStore((state) => state.getPendingChange)

    const currentHours = entry?.hours || 0
    const h = Math.floor(currentHours)
    const m = Math.round((currentHours - h) * 60)
    const initialValue = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`

    const [durationInput, setDurationInput] = useState(initialValue)

    const durationOptions = []
    for (let hours = 0; hours <= 24; hours++) {
        for (let minutes = 0; minutes < 60; minutes += 15) {
            if (hours === 24 && minutes > 0) break
            const value = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
            durationOptions.push(value)
        }
    }

    const isEditing = activeCellKey === cellKey
    const hasPendingChange = getPendingChange(cellKey) !== undefined
    const open = isEditing

    const saveHours = (hours: number) => {
        if (isNaN(hours) || hours < 0) {
            return
        }

        if (entry && hours === entry.hours) {
            setActiveCellKey(null)
            return
        }

        const addChange = useHoursBatchStore.getState().addChange

        addChange({
            entryId: entry?.id || null,
            date: dateKey,
            type,
            hours,
            originalHours: entry?.hours || null,
            action: entry ? "update" : "create",
            userId,
        })

        setActiveCellKey(null)
    }

    const parseDuration = (input: string): number | null => {
        const match = input.match(/^(\d{1,2}):(\d{2})$/)
        if (!match) return null

        const hours = parseInt(match[1])
        const minutes = parseInt(match[2])

        if (isNaN(hours) || isNaN(minutes) || hours < 0 || minutes < 0 || minutes > 59) {
            return null
        }

        return hours + minutes / 60
    }

    const handleSelectOption = (value: string) => {
        setDurationInput(value)
        const totalHours = parseDuration(value)
        if (totalHours !== null) {
            saveHours(totalHours)
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

        // Calculate progress bar percentages for grand total
        const standardHours = 8
        const blueWidth = Math.min((hours / standardHours) * 100, 100)
        const redWidth = hours > standardHours ? ((hours - standardHours) / standardHours) * 100 : 0

        return (
            <div className="relative">
                {showProgressBar && isGrandTotal && hours > 0 && (
                    <div className="absolute -top-0.5 left-0 right-0 h-0.5 flex">
                        <div className="bg-blue-500" style={{ width: `${blueWidth}%` }} />
                        {redWidth > 0 && (
                            <div className="bg-red-500" style={{ width: `${redWidth}%` }} />
                        )}
                    </div>
                )}
                <div
                    className={`h-8 w-16 text-center flex items-center justify-center rounded mx-auto ${
                        isTotal || isGrandTotal ? "font-bold" : "font-normal"
                    } ${hours === 0 ? "text-muted-foreground" : "text-foreground"}`}
                >
                    {hours === 0 ? "-" : formatHoursToTime(hours)}
                </div>
            </div>
        )
    }

    const hours = entry?.hours || 0
    const displayValue = hours === 0 ? "-" : formatHoursToTime(hours)

    if (isEditing) {
        return (
            <div className="flex flex-col items-center gap-1 mx-auto w-20">
                <Popover open={open} onOpenChange={(isOpen) => !isOpen && setActiveCellKey(null)}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="h-8 w-16 justify-center text-sm p-1"
                        >
                            {durationInput}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                        <Command>
                            <CommandInput
                                placeholder="HH:MM"
                                value={durationInput}
                                onValueChange={(value) => setDurationInput(value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault()
                                        const totalHours = parseDuration(durationInput)
                                        if (totalHours !== null) {
                                            saveHours(totalHours)
                                            setActiveCellKey(null)
                                        }
                                    } else if (e.key === "Escape") {
                                        setActiveCellKey(null)
                                    }
                                }}
                            />
                            <CommandList>
                                <CommandEmpty>Type duration (HH:MM)</CommandEmpty>
                                <CommandGroup>
                                    {durationOptions.map((option) => (
                                        <CommandItem
                                            key={option}
                                            value={option}
                                            onSelect={(value) => {
                                                setDurationInput(value)
                                                handleSelectOption(value)
                                                setActiveCellKey(null)
                                            }}
                                        >
                                            {option}
                                            <Check
                                                className={cn(
                                                    "ml-auto h-4 w-4",
                                                    durationInput === option
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                {entry?.description && (
                    <span className="text-xs text-muted-foreground truncate max-w-20">
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
                } ${hasPendingChange ? "bg-amber-50/30" : ""}`}
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
