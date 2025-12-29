"use client"

import { ChevronDown, ChevronRight } from "lucide-react"
import { Fragment, useMemo, useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import type { HourType } from "@/../../prisma/generated/client"
import { TableCell, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useHoursStore } from "../stores/hours-store"
import { EditableHourCell } from "./editable-hour-cell"
import { getTypeLabel, getTypeColor } from "../utils/table-helpers"
import type { HourEntryDisplay } from "../schemas/hour-entry-schemas"
import { getHourTypeTranslationKey } from "../utils/translation-helpers"

interface HourTypeRowProps {
    hourType: HourType
    dates: Date[]
    groupedEntries: Record<string, Record<string, HourEntryDisplay>>
    userId: string
    holidays?: Array<{ date: Date; name: string }>
    initiallyExpanded?: boolean
}

export function HourTypeRow({
    hourType,
    dates,
    groupedEntries,
    userId,
    holidays = [],
    initiallyExpanded = false,
}: HourTypeRowProps) {
    const tTypes = useTranslations("hours.types")
    const tLabels = useTranslations("hours.labels")
    const expandedTypes = useHoursStore((state) => state.expandedTypes)
    const toggleType = useHoursStore((state) => state.toggleType)
    const [isExpanded, setIsExpanded] = useState(initiallyExpanded)

    const getTranslatedTypeLabel = (type: string): string => {
        if (type === "GRAND_TOTAL") {
            return `${tLabels("grandTotal")} (${tTypes("work")})`
        }
        if (type.endsWith("_TRACKED")) {
            return tLabels("tracked")
        }
        if (type.endsWith("_MANUAL")) {
            return tLabels("manual")
        }
        if (type.endsWith("_TOTAL")) {
            const baseType = type.replace("_TOTAL", "") as HourType
            return tTypes(getHourTypeTranslationKey(baseType))
        }
        return tTypes(getHourTypeTranslationKey(type))
    }

    useEffect(() => {
        setIsExpanded(expandedTypes.has(hourType))
    }, [expandedTypes, hourType])

    const holidaysByDate = useMemo(() => {
        const map = new Map<string, { name: string }>()
        holidays.forEach((holiday) => {
            const holidayDate = new Date(holiday.date)
            const year = holidayDate.getFullYear()
            const month = String(holidayDate.getMonth() + 1).padStart(2, "0")
            const day = String(holidayDate.getDate()).padStart(2, "0")
            const key = `${year}-${month}-${day}`
            map.set(key, { name: holiday.name })
        })
        return map
    }, [holidays])

    const isHoliday = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        const key = `${year}-${month}-${day}`
        return holidaysByDate.get(key)
    }

    const isToday = (date: Date) => {
        const today = new Date()
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        )
    }

    const trackedKey = `${hourType}_TRACKED`
    const manualKey = `${hourType}_MANUAL`
    const totalKey = `${hourType}_TOTAL`

    const handleToggle = () => {
        toggleType(hourType)
    }

    return (
        <>
            <TableRow>
                <TableCell className="font-medium sticky left-0 z-10 bg-background min-w-[150px] max-w-[200px] border-r">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="cursor-default flex items-center gap-2">
                                <button
                                    onClick={handleToggle}
                                    className="p-1 hover:bg-muted rounded flex-shrink-0"
                                >
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                </button>
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold truncate ${getTypeColor(totalKey)}`}
                                >
                                    {getTranslatedTypeLabel(totalKey)}
                                </span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="text-sm">{getTranslatedTypeLabel(totalKey)}</div>
                        </TooltipContent>
                    </Tooltip>
                </TableCell>
                {dates.map((date) => {
                    const year = date.getFullYear()
                    const month = String(date.getMonth() + 1).padStart(2, "0")
                    const day = String(date.getDate()).padStart(2, "0")
                    const dateKey = `${year}-${month}-${day}`

                    const entry = groupedEntries[totalKey]?.[dateKey]
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6
                    const holiday = isHoliday(date)

                    return (
                        <TableCell
                            key={dateKey}
                            className={`text-center p-2 ${isWeekend ? "bg-muted/50" : ""} ${holiday ? "bg-purple-100 dark:bg-purple-950" : ""} ${isToday(date) ? "bg-primary/5" : ""}`}
                        >
                            <EditableHourCell
                                date={new Date(dateKey)}
                                type={hourType}
                                entry={{
                                    ...entry,
                                    taskId: trackedKey,
                                }}
                                userId={userId}
                            />
                        </TableCell>
                    )
                })}
            </TableRow>

            {isExpanded && (
                <Fragment key={`expanded-${hourType}`}>
                    <TableRow>
                        <TableCell className="font-medium sticky left-0 z-10 bg-background min-w-[150px] max-w-[200px] border-r">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="cursor-default pl-8">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold truncate ${getTypeColor(trackedKey)}`}
                                        >
                                            {getTranslatedTypeLabel(trackedKey)}
                                        </span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div className="text-sm">
                                        {getTranslatedTypeLabel(trackedKey)}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TableCell>
                        {dates.map((date) => {
                            const year = date.getFullYear()
                            const month = String(date.getMonth() + 1).padStart(2, "0")
                            const day = String(date.getDate()).padStart(2, "0")
                            const dateKey = `${year}-${month}-${day}`

                            const entry = groupedEntries[trackedKey]?.[dateKey]
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6
                            const holiday = isHoliday(date)

                            return (
                                <TableCell
                                    key={dateKey}
                                    className={`text-center p-2 ${isWeekend ? "bg-muted/50" : ""} ${holiday ? "bg-purple-100 dark:bg-purple-950" : ""} ${isToday(date) ? "bg-primary/5" : ""}`}
                                >
                                    <EditableHourCell
                                        date={date}
                                        type={hourType}
                                        entry={{
                                            ...entry,
                                            taskId: "tracked",
                                        }}
                                        userId={userId}
                                    />
                                </TableCell>
                            )
                        })}
                    </TableRow>

                    <TableRow>
                        <TableCell className="font-medium sticky left-0 z-10 bg-background min-w-[150px] max-w-[200px] border-r">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="cursor-default pl-8">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold truncate ${getTypeColor(manualKey)}`}
                                        >
                                            {getTranslatedTypeLabel(manualKey)}
                                        </span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div className="text-sm">
                                        {getTranslatedTypeLabel(manualKey)}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TableCell>
                        {dates.map((date) => {
                            const year = date.getFullYear()
                            const month = String(date.getMonth() + 1).padStart(2, "0")
                            const day = String(date.getDate()).padStart(2, "0")
                            const dateKey = `${year}-${month}-${day}`

                            const entry = groupedEntries[manualKey]?.[dateKey]
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6
                            const holiday = isHoliday(date)

                            return (
                                <TableCell
                                    key={dateKey}
                                    className={`text-center p-2 ${isWeekend ? "bg-muted/50" : ""} ${holiday ? "bg-purple-100 dark:bg-purple-950" : ""} ${isToday(date) ? "bg-primary/5" : ""}`}
                                >
                                    <EditableHourCell
                                        date={date}
                                        type={hourType}
                                        entry={entry}
                                        userId={userId}
                                    />
                                </TableCell>
                            )
                        })}
                    </TableRow>
                </Fragment>
            )}
        </>
    )
}
