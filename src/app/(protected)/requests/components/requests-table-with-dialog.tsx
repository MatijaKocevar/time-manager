"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { RequestsTable } from "./requests-table"
import { RequestDetailDialog } from "./request-detail-dialog"
import { type RequestDisplay, type RequestType } from "../schemas/request-schemas"
import { createRequest } from "../actions/request-actions"
import { requestKeys } from "../query-keys"
import { useRequestStore } from "../stores/request-store"
import { REQUEST_TYPES, REQUEST_TYPE } from "../constants"
import { getRequestTypeTranslationKey } from "../utils/translation-helpers"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface RequestsTableWithDialogProps {
    requests: RequestDisplay[]
    showUser: boolean
}

export function RequestsTableWithDialog({ requests, showUser }: RequestsTableWithDialogProps) {
    const [selectedRequest, setSelectedRequest] = useState<RequestDisplay | null>(null)
    const [isNewRequestOpen, setIsNewRequestOpen] = useState(false)
    const t = useTranslations("requests.form")
    const tCommon = useTranslations("common")
    const tTypes = useTranslations("requests.types")
    const queryClient = useQueryClient()
    const formData = useRequestStore((state) => state.formData)
    const setFormData = useRequestStore((state) => state.setFormData)
    const resetForm = useRequestStore((state) => state.resetForm)

    const mutation = useMutation({
        mutationFn: createRequest,
        onSuccess: (result) => {
            if (result.success) {
                queryClient.invalidateQueries({ queryKey: requestKeys.all })
                resetForm()
                setIsNewRequestOpen(false)
            }
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.type || !formData.startDate || !formData.endDate) return

        mutation.mutate({
            type: formData.type as RequestType,
            startDate: formData.startDate,
            endDate: formData.endDate,
            reason: formData.reason,
            location: formData.type === REQUEST_TYPE.WORK_FROM_HOME ? formData.location : undefined,
            skipWeekends: formData.skipWeekends,
            skipHolidays: formData.skipHolidays,
        })
    }

    const handleNewRequestClick = () => {
        resetForm()
        setIsNewRequestOpen(true)
    }

    const handleDialogClose = (open: boolean) => {
        if (!open) {
            setIsNewRequestOpen(false)
            resetForm()
        }
    }

    const needsLocation = formData.type === REQUEST_TYPE.WORK_FROM_HOME

    return (
        <>
            <RequestsTable
                requests={requests}
                showUser={showUser}
                onRequestClick={setSelectedRequest}
                onNewRequestClick={handleNewRequestClick}
            />
            <RequestDetailDialog
                request={selectedRequest}
                open={!!selectedRequest}
                onOpenChange={(open) => !open && setSelectedRequest(null)}
            />
            <Dialog open={isNewRequestOpen} onOpenChange={handleDialogClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("newRequest")}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="type">{tCommon("fields.type")}</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) =>
                                    setFormData({ type: value as RequestType })
                                }
                            >
                                <SelectTrigger id="type">
                                    <SelectValue placeholder={t("selectType")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {REQUEST_TYPES.map((rt) => (
                                        <SelectItem key={rt.value} value={rt.value}>
                                            {tTypes(getRequestTypeTranslationKey(rt.value))}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">{tCommon("fields.startDate")}</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ startDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">{tCommon("fields.endDate")}</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ endDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                id="skip-weekends"
                                type="checkbox"
                                checked={formData.skipWeekends}
                                onChange={(e) => setFormData({ skipWeekends: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label htmlFor="skip-weekends" className="cursor-pointer">
                                {t("skipWeekends")}
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                id="skip-holidays"
                                type="checkbox"
                                checked={formData.skipHolidays}
                                onChange={(e) => setFormData({ skipHolidays: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label htmlFor="skip-holidays" className="cursor-pointer">
                                {t("skipHolidays")}
                            </Label>
                        </div>

                        {needsLocation && (
                            <div className="space-y-2">
                                <Label htmlFor="location">{tCommon("fields.location")}</Label>
                                <Input
                                    id="location"
                                    type="text"
                                    placeholder={t("enterLocation")}
                                    value={formData.location}
                                    onChange={(e) => setFormData({ location: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="reason">{t("reasonOptional")}</Label>
                            <Input
                                id="reason"
                                type="text"
                                placeholder={t("enterReason")}
                                value={formData.reason}
                                onChange={(e) => setFormData({ reason: e.target.value })}
                            />
                        </div>

                        {mutation.data?.error && (
                            <div className="text-sm text-red-600">{mutation.data.error}</div>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleDialogClose(false)}
                            >
                                {tCommon("actions.cancel")}
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending
                                    ? tCommon("status.submitting")
                                    : t("submitRequest")}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
