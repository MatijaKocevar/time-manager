import { ChevronDown, ChevronRight } from "lucide-react"
import { Fragment, useMemo, useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import type { HourType } from "@/../../prisma/generated/client"
import { TableCell, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useHoursStore } from "../stores/hours-store"
import { EditableHourCell } from "./editable-hour-cell"
import { getTypeColor } from "../utils/table-helpers"
import type { HourEntryDisplay } from "../schemas/hour-entry-schemas"
import { getTranslatedTypeLabel } from "../utils/translation-helpers"
import { buildHolidayMap, isToday, getHolidayForDate } from "../utils/date-helpers"
import { ROW_SUFFIXES, HOUR_TYPE_VALUES } from "../constants/hour-types"

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

    useEffect(() => {
        setIsExpanded(expandedTypes.has(hourType))
    }, [expandedTypes, hourType])

    const holidaysByDate = useMemo(() => buildHolidayMap(holidays), [holidays])

    const trackedKey = `${hourType}${ROW_SUFFIXES.TRACKED}`
    const manualKey = `${hourType}${ROW_SUFFIXES.MANUAL}`
    const totalKey = `${hourType}${ROW_SUFFIXES.TOTAL}`

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
                                    {getTranslatedTypeLabel(totalKey, tTypes, tLabels)}
                                </span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="text-sm">
                                {getTranslatedTypeLabel(totalKey, tTypes, tLabels)}
                            </div>
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
                    const holiday = getHolidayForDate(date, holidaysByDate)

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
                                            {getTranslatedTypeLabel(trackedKey, tTypes, tLabels)}
                                        </span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div className="text-sm">
                                        {getTranslatedTypeLabel(trackedKey, tTypes, tLabels)}
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
                            const holiday = getHolidayForDate(date, holidaysByDate)

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
                                            taskId: trackedKey,
                                        }}
                                        userId={userId}
                                    />
                                </TableCell>
                            )
                        })}
                    </TableRow>

                    {hourType !== HOUR_TYPE_VALUES.VACATION &&
                        hourType !== HOUR_TYPE_VALUES.SICK_LEAVE && (
                            <TableRow>
                                <TableCell className="font-medium sticky left-0 z-10 bg-background min-w-[150px] max-w-[200px] border-r">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="cursor-default pl-8">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold truncate ${getTypeColor(manualKey)}`}
                                                >
                                                    {getTranslatedTypeLabel(
                                                        manualKey,
                                                        tTypes,
                                                        tLabels
                                                    )}
                                                </span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <div className="text-sm">
                                                {getTranslatedTypeLabel(manualKey, tTypes, tLabels)}
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
                                    const holiday = getHolidayForDate(date, holidaysByDate)

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
                        )}
                </Fragment>
            )}
        </>
    )
}
