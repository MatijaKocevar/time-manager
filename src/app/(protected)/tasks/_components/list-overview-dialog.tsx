"use client"

import { useTranslations, useLocale } from "next-intl"
import { BarChart3, Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatHoursMinutes } from "@/app/(protected)/hours/_utils/time-helpers"
import { useListOverview } from "../_hooks/use-list-overview"

interface ListOverviewDialogProps {
    open: boolean
    listId: string | null
    listName: string
    listColor: string | null
    onOpenChange: (open: boolean) => void
}

export function ListOverviewDialog({
    open,
    listId,
    listName,
    listColor,
    onOpenChange,
}: ListOverviewDialogProps) {
    const t = useTranslations("tasks.listOverview")
    const locale = useLocale()
    const { data, isLoading } = useListOverview(listId, open)

    const overview = data && "data" in data ? data.data : null
    const error = data && "error" in data ? data.error : null

    const workShare =
        overview && overview.totalHours > 0 ? (overview.workHours / overview.totalHours) * 100 : 0

    const dateFormat = new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        {t("title", { name: overview?.listName ?? listName })}
                    </DialogTitle>
                    <DialogDescription>{t("description")}</DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <p className="py-4 text-sm text-destructive">{error}</p>
                ) : overview ? (
                    <div className="space-y-5">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                {listColor && (
                                    <span
                                        className="h-2.5 w-2.5 rounded-full"
                                        style={{ backgroundColor: listColor }}
                                    />
                                )}
                                <span className="text-sm text-muted-foreground">{t("total")}</span>
                                {overview.activeTimer && (
                                    <Badge variant="secondary" className="ml-auto">
                                        {t("running")}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-3xl font-bold tabular-nums">
                                {formatHoursMinutes(overview.totalHours)}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full bg-blue-500"
                                    style={{ width: `${workShare}%` }}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="text-muted-foreground">{t("work")}</p>
                                    <p className="font-semibold tabular-nums">
                                        {formatHoursMinutes(overview.workHours)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">{t("offHours")}</p>
                                    <p className="font-semibold tabular-nums">
                                        {formatHoursMinutes(overview.offHoursHours)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                            <span>
                                {overview.firstEntryAt && overview.lastEntryAt
                                    ? `${dateFormat.format(overview.firstEntryAt)} – ${dateFormat.format(overview.lastEntryAt)}`
                                    : t("empty")}
                            </span>
                            <span>{t("taskCount", { count: overview.taskCount })}</span>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}
