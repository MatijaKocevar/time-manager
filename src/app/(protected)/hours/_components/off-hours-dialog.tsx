"use client"

import { useTranslations, useLocale } from "next-intl"
import { Loader2, MoonStar, RotateCcw } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { formatHoursMinutes } from "../_utils/time-helpers"
import { useOffHours } from "../_hooks/use-off-hours"

interface OffHoursDialogProps {
    open: boolean
    initialDate: string
    onOpenChange: (open: boolean) => void
}

export function OffHoursDialog({ open, initialDate, onOpenChange }: OffHoursDialogProps) {
    const t = useTranslations("hours.offHours")
    const locale = useLocale()
    const {
        date,
        from,
        to,
        includeManual,
        applyToFuture,
        preview,
        windowId,
        isLoading,
        error,
        setDate,
        setFrom,
        setTo,
        setIncludeManual,
        setApplyToFuture,
        clearPreview,
        loadPreview,
        apply,
        undo,
    } = useOffHours({ initialDate })

    const timeFormat = new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MoonStar className="h-4 w-4" />
                        {t("title")}
                    </DialogTitle>
                    <DialogDescription>{t("description")}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                            <Label htmlFor="off-hours-date">{t("date")}</Label>
                            <Input
                                id="off-hours-date"
                                type="date"
                                value={date}
                                onChange={(event) => {
                                    setDate(event.target.value)
                                    clearPreview()
                                }}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="off-hours-from">{t("from")}</Label>
                            <Input
                                id="off-hours-from"
                                type="time"
                                value={from}
                                onChange={(event) => {
                                    setFrom(event.target.value)
                                    clearPreview()
                                }}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="off-hours-to">{t("to")}</Label>
                            <Input
                                id="off-hours-to"
                                type="time"
                                value={to}
                                onChange={(event) => {
                                    setTo(event.target.value)
                                    clearPreview()
                                }}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="off-hours-manual"
                            checked={includeManual}
                            onCheckedChange={(checked) => {
                                setIncludeManual(checked === true)
                                clearPreview()
                            }}
                            disabled={isLoading}
                        />
                        <Label htmlFor="off-hours-manual" className="text-sm font-normal">
                            {t("includeManual")}
                        </Label>
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="off-hours-future"
                            checked={applyToFuture}
                            onCheckedChange={(checked) => setApplyToFuture(checked === true)}
                            disabled={isLoading}
                        />
                        <Label htmlFor="off-hours-future" className="text-sm font-normal">
                            {t("applyToFuture")}
                        </Label>
                    </div>

                    {preview && (
                        <div className="space-y-3 rounded-md border p-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">{t("preview")}</span>
                                <span className="text-muted-foreground">
                                    {formatHoursMinutes(preview.totals.convertedSeconds / 3600)}{" "}
                                    {t("willMove")}
                                </span>
                            </div>

                            {preview.tracked.length === 0 && preview.manual.length === 0 && (
                                <p className="text-sm text-muted-foreground">{t("nothing")}</p>
                            )}

                            <div className="max-h-56 space-y-2 overflow-auto">
                                {preview.tracked.map((segment) => (
                                    <div
                                        key={segment.id}
                                        className="flex items-center justify-between gap-2 text-sm"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate">{segment.taskTitle}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {timeFormat.format(segment.startTime)} –{" "}
                                                {timeFormat.format(segment.endTime ?? new Date())}
                                                {" · "}
                                                {formatHoursMinutes(segment.insideSeconds / 3600)}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={
                                                segment.action === "split" ? "secondary" : "outline"
                                            }
                                        >
                                            {segment.action === "split"
                                                ? t("willSplit")
                                                : segment.type}
                                        </Badge>
                                    </div>
                                ))}

                                {preview.manual.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="flex items-center justify-between gap-2 text-sm"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate">
                                                {entry.description || t("manualEntry")}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {t("noTimeOfDay")}
                                            </p>
                                        </div>
                                        <Badge variant="outline">
                                            {formatHoursMinutes(entry.hours)}
                                        </Badge>
                                    </div>
                                ))}
                            </div>

                            {preview.activeTimer && (
                                <p className="text-xs text-destructive">{t("timerRunning")}</p>
                            )}
                        </div>
                    )}

                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>

                <DialogFooter className="gap-2">
                    {windowId ? (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={undo}
                                disabled={isLoading}
                            >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                {t("undo")}
                            </Button>
                            <Button type="button" onClick={() => onOpenChange(false)}>
                                {t("done")}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                {t("cancel")}
                            </Button>
                            {preview ? (
                                <Button
                                    type="button"
                                    onClick={apply}
                                    disabled={isLoading || preview.activeTimer}
                                >
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t("confirm")}
                                </Button>
                            ) : (
                                <Button type="button" onClick={loadPreview} disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t("previewAction")}
                                </Button>
                            )}
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
