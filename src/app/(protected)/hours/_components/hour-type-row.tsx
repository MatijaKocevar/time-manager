import { useMemo } from "react"
import { useTranslations } from "next-intl"
import type { HourType } from "@/../../prisma/generated/client"
import { TableCell, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { getTypeColor } from "../_utils/table-helpers"
import type { HourEntryDisplay } from "../_schemas/hour-entry-schemas"
import { getTranslatedTypeLabel } from "../_utils/translation-helpers"
import { buildHolidayMap, isToday, getHolidayForDate } from "../_utils/date-helpers"
import { ROW_SUFFIXES } from "../_constants/hour-types"
import { formatHoursToTime } from "../_utils/time-helpers"

interface HourTypeRowProps {
    hourType: HourType
    dates: Date[]
    groupedEntries: Record<string, Record<string, HourEntryDisplay>>
    holidays?: Array<{ date: Date; name: string }>
}

export function HourTypeRow({ hourType, dates, groupedEntries, holidays = [] }: HourTypeRowProps) {
    const tTypes = useTranslations("hours.types")
    const tLabels = useTranslations("hours.labels")

    const holidaysByDate = useMemo(() => buildHolidayMap(holidays), [holidays])

    const totalKey = `${hourType}${ROW_SUFFIXES.TOTAL}`

    return (
        <TableRow>
            <TableCell className="font-medium sticky left-0 z-10 bg-background min-w-[150px] max-w-[200px] border-r">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="cursor-default flex items-center gap-2">
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
                const hours = entry?.hours || 0

                return (
                    <TableCell
                        key={dateKey}
                        className={`text-center p-2 ${isWeekend ? "bg-muted/50" : ""} ${holiday ? "bg-orange-100 dark:bg-orange-950" : ""} ${isToday(date) ? "bg-primary/5" : ""}`}
                    >
                        <div
                            className={`h-8 w-16 text-center flex items-center justify-center rounded mx-auto ${
                                hours === 0 ? "text-muted-foreground" : "text-foreground"
                            }`}
                        >
                            {hours === 0 ? "-" : formatHoursToTime(hours)}
                        </div>
                    </TableCell>
                )
            })}
        </TableRow>
    )
}
