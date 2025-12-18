"use client"

import { useTranslations } from "next-intl"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { type RequestDisplay } from "../schemas/request-schemas"
import { RequestDetailClient } from "./request-detail-client"

interface RequestDetailDialogProps {
    request: RequestDisplay | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function RequestDetailDialog({ request, open, onOpenChange }: RequestDetailDialogProps) {
    const t = useTranslations("requests.form")

    if (!request) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t("requestDetails")}</DialogTitle>
                </DialogHeader>
                <RequestDetailClient request={request} />
            </DialogContent>
        </Dialog>
    )
}
