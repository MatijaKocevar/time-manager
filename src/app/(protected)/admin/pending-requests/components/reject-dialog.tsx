"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { PendingRequestTranslations } from "../types"

interface RejectDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    rejectionReason: string
    onReasonChange: (reason: string) => void
    onConfirm: () => void
    isPending: boolean
    translations: PendingRequestTranslations["reject"]
}

export function RejectDialog({
    open,
    onOpenChange,
    rejectionReason,
    onReasonChange,
    onConfirm,
    isPending,
    translations,
}: RejectDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{translations.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="rejectionReason">{translations.reason}</Label>
                        <Input
                            id="rejectionReason"
                            value={rejectionReason}
                            onChange={(e) => onReasonChange(e.target.value)}
                            placeholder={translations.reasonPlaceholder}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        {translations.cancel}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isPending || !rejectionReason}
                    >
                        {isPending ? translations.rejecting : translations.rejectRequest}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
