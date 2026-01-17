"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useHoursStore } from "../stores/hours-store"
import { getHourTypeTranslationKey } from "../utils/translation-helpers"
import { formatHoursMinutes } from "../utils/time-helpers"
import { HOUR_TYPE_COLORS } from "../constants/hour-types"

export function HourTypeBreakdownDialog() {
    const t = useTranslations("hours.breakdown")
    const tTypes = useTranslations("hours.types")
    const tCommon = useTranslations("common.actions")

    const { isOpen, type, entries } = useHoursStore((state) => state.hourTypeDialog)
    const closeDialog = useHoursStore((state) => state.closeHourTypeDialog)

    const sortedEntries = useMemo(() => {
        if (!entries) return []
        return [...entries].sort((a, b) => b.date.getTime() - a.date.getTime())
    }, [entries])

    const totalHours = useMemo(() => {
        return sortedEntries.reduce((sum, entry) => sum + entry.hours, 0)
    }, [sortedEntries])

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
        }).format(date)
    }

    if (!type) return null

    return (
        <Dialog open={isOpen} onOpenChange={closeDialog}>
            <DialogContent className="w-[95vw] sm:max-w-3xl md:max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span
                            className={`px-2 py-1 rounded text-sm font-medium ${HOUR_TYPE_COLORS[type]}`}
                        >
                            {tTypes(getHourTypeTranslationKey(type))}
                        </span>
                        <span>{t("title")}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="overflow-y-auto" style={{ maxHeight: "500px" }}>
                    {sortedEntries.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">{t("noEntries")}</div>
                    ) : (
                        <>
                            {/* Desktop table view */}
                            <div className="hidden md:block">
                                <table className="w-full">
                                    <thead className="sticky top-0 bg-background z-10 border-b">
                                        <tr>
                                            <th className="text-left py-3 px-4 font-semibold">
                                                {t("date")}
                                            </th>
                                            <th className="text-right py-3 px-4 font-semibold">
                                                {t("hours")}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedEntries.map((entry, index) => {
                                            const weekend = entry.date.getDay() === 0 || entry.date.getDay() === 6
                                            return (
                                                <tr
                                                    key={index}
                                                    className={`border-b ${weekend ? "bg-muted/50" : ""}`}
                                                >
                                                    <td className="py-3 px-4">
                                                        {formatDate(entry.date)}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-medium">
                                                        {formatHoursMinutes(entry.hours)}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile card view */}
                            <div className="md:hidden space-y-2">
                                {sortedEntries.map((entry, index) => {
                                    const weekend = entry.date.getDay() === 0 || entry.date.getDay() === 6
                                    return (
                                        <div
                                            key={index}
                                            className={`p-4 rounded-lg border ${weekend ? "bg-muted/50" : ""}`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">
                                                    {formatDate(entry.date)}
                                                </span>
                                                <span className="text-lg font-semibold">
                                                    {formatHoursMinutes(entry.hours)}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">{t("totalHours")}:</span>
                        <span className="text-xl font-bold">{formatHoursMinutes(totalHours)}</span>
                    </div>
                    <Button onClick={closeDialog}>{tCommon("close")}</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
