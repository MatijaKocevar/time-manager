"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatDate } from "../utils/helpers"
import type { RequestHistoryTranslations } from "../types"

interface CancelDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    cancellationReason: string
    onReasonChange: (reason: string) => void
    onConfirm: () => void
    isPending: boolean
    translations: RequestHistoryTranslations["cancel"]
    selectedRequestData: {
        userName: string
        type: string
        startDate: Date
        endDate: Date
    } | null
    locale: string
}

export function CancelDialog({
    open,
    onOpenChange,
    cancellationReason,
    onReasonChange,
    onConfirm,
    isPending,
    translations,
    selectedRequestData,
    locale,
}: CancelDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{translations.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            {translations.confirmQuestion}
                        </p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            <li>{translations.markCancelled}</li>
                            <li>{translations.removeHours}</li>
                            <li>{translations.recalculate}</li>
                        </ul>
                    </div>
                    {selectedRequestData && (
                        <div className="space-y-2 p-3 bg-muted rounded-md">
                            <div className="text-sm">
                                <span className="font-semibold">{translations.user} </span>
                                {selectedRequestData.userName}
                            </div>
                            <div className="text-sm">
                                <span className="font-semibold">{translations.type} </span>
                                {selectedRequestData.type}
                            </div>
                            <div className="text-sm">
                                <span className="font-semibold">{translations.period} </span>
                                {formatDate(selectedRequestData.startDate, locale)} -{" "}
                                {formatDate(selectedRequestData.endDate, locale)}
                            </div>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="cancellation-reason">
                            {translations.reason}{" "}
                            <span className="text-red-600">{translations.reasonRequired}</span>
                        </Label>
                        <Textarea
                            id="cancellation-reason"
                            value={cancellationReason}
                            onChange={(e) => onReasonChange(e.target.value)}
                            placeholder={translations.reasonPlaceholder}
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        {translations.close}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={!cancellationReason.trim() || isPending}
                    >
                        {isPending ? translations.cancelling : translations.cancelRequest}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
