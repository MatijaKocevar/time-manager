"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { cancelRequest, updateRequest, createRequest } from "../_actions/request-actions"
import { requestKeys } from "../query-keys"
import { hourKeys } from "../../hours/query-keys"
import { REQUEST_TYPES, REQUEST_STATUS_COLORS, REQUEST_STATUS, REQUEST_TYPE } from "../_constants"
import { useRequestStore } from "../_stores/request-store"
import { type RequestType, type RequestDisplay } from "../_schemas/request-schemas"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { DateTimePicker } from "@/components/ui/datetime-picker"
import { useEffect } from "react"
import { format } from "date-fns"
import {
    getRequestTypeTranslationKey,
    getRequestStatusTranslationKey,
} from "../_utils/translation-helpers"

interface RequestDetailFormProps {
    request?: RequestDisplay
    onSuccess?: () => void
    hasUrnikCredentials?: boolean
}

export function RequestDetailForm({
    request,
    onSuccess,
    hasUrnikCredentials = false,
}: RequestDetailFormProps) {
    const t = useTranslations("requests.form")
    const tCommon = useTranslations("common")
    const tTypes = useTranslations("requests.types")
    const tStatuses = useTranslations("requests.statuses")
    const router = useRouter()
    const queryClient = useQueryClient()
    const formData = useRequestStore((state) => state.formData)
    const setFormData = useRequestStore((state) => state.setFormData)

    useEffect(() => {
        if (request) {
            setFormData({
                type: request.type,
                startDate: new Date(request.startDate).toISOString().split("T")[0],
                endDate: new Date(request.endDate).toISOString().split("T")[0],
                startTime: request.startTime || "09:00",
                endTime: request.endTime || "17:00",
                isFullDay: request.isFullDay ?? true,
                reason: request.reason || "",
                location: request.location || "",
            })
        }
    }, [request, setFormData])

    const updateMutation = useMutation({
        mutationFn: updateRequest,
        onSuccess: (result) => {
            if (result.success) {
                queryClient.invalidateQueries({ queryKey: requestKeys.all })
                queryClient.invalidateQueries({ queryKey: hourKeys.all })
                onSuccess?.()
            }
        },
    })

    const createMutation = useMutation({
        mutationFn: createRequest,
        onSuccess: (result) => {
            if (result.success) {
                queryClient.invalidateQueries({ queryKey: requestKeys.all })
                queryClient.invalidateQueries({ queryKey: hourKeys.all })
                onSuccess?.()
            }
        },
    })

    const cancelMutation = useMutation({
        mutationFn: cancelRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: requestKeys.all })
            router.push("/requests")
        },
    })

    const handleCancel = () => {
        if (!request) return
        cancelMutation.mutate({ id: request.id })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.type || !formData.startDate || !formData.endDate) return

        if (request) {
            updateMutation.mutate({
                id: request.id,
                type: formData.type as RequestType,
                startDate: formData.startDate,
                endDate: formData.endDate,
                startTime: formData.isFullDay ? undefined : formData.startTime,
                endTime: formData.isFullDay ? undefined : formData.endTime,
                isFullDay: formData.isFullDay,
                reason: formData.reason,
                location:
                    formData.type === REQUEST_TYPE.WORK_FROM_HOME ? formData.location : undefined,
            })
        } else {
            createMutation.mutate({
                type: formData.type as RequestType,
                startDate: formData.startDate,
                endDate: formData.endDate,
                startTime: formData.isFullDay ? undefined : formData.startTime,
                endTime: formData.isFullDay ? undefined : formData.endTime,
                isFullDay: formData.isFullDay,
                reason: formData.reason,
                location:
                    formData.type === REQUEST_TYPE.WORK_FROM_HOME ? formData.location : undefined,
                skipWeekends: formData.skipWeekends,
                skipHolidays: formData.skipHolidays,
                sendToUrnikNet: formData.sendToUrnikNet,
            })
        }
    }

    const calculateRequestedHours = () => {
        if (
            formData.isFullDay ||
            !formData.startDate ||
            !formData.endDate ||
            !formData.startTime ||
            !formData.endTime
        ) {
            return null
        }

        const [startHour, startMin] = formData.startTime.split(":").map(Number)
        const [endHour, endMin] = formData.endTime.split(":").map(Number)

        const start = new Date(formData.startDate)
        start.setHours(startHour, startMin, 0, 0)

        const end = new Date(formData.endDate)
        end.setHours(endHour, endMin, 0, 0)

        const diffMs = end.getTime() - start.getTime()
        return diffMs / (1000 * 60 * 60)
    }

    const requestedHours = calculateRequestedHours()

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString()
    }

    const isUrnikSynced = !!request?.urnikNetSynced
    const isEditable = !isUrnikSynced && (!request || request.status === REQUEST_STATUS.PENDING)
    const canCancel = request && request.status === REQUEST_STATUS.PENDING
    const needsLocation = formData.type === REQUEST_TYPE.WORK_FROM_HOME
    const isPending = updateMutation.isPending || createMutation.isPending

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {request && (
                <div className="flex items-center justify-between">
                    <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
                            REQUEST_STATUS_COLORS[request.status]
                        }`}
                    >
                        {tStatuses(getRequestStatusTranslationKey(request.status))}
                    </span>
                    <div className="flex gap-2">
                        {canCancel && (
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                disabled={cancelMutation.isPending}
                            >
                                {t("cancelRequest")}
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {isUrnikSynced && (
                <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
                    {t("urnikSyncedNote")}
                </div>
            )}

            {request?.urnikNetStatus === "FAILED" && request?.urnikNetError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950">
                    <div className="flex items-start gap-3">
                        <div className="flex-1">
                            <h4 className="text-sm font-semibold text-red-800 dark:text-red-200">
                                {t("urnikNetSyncError")}
                            </h4>
                            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                                {t("urnikNetSyncFailed")}
                            </p>
                            <p className="mt-2 text-xs text-red-600 dark:text-red-400 font-mono">
                                {request.urnikNetError}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {request?.urnikNetSynced && request?.urnikNetStatus === "PENDING" && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                    {t("urnikNetSyncPending")}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="type">{tCommon("fields.type")}</Label>
                {isEditable ? (
                    <Select
                        value={formData.type || (request?.type ?? "")}
                        onValueChange={(value) => setFormData({ type: value as RequestType })}
                    >
                        <SelectTrigger id="type">
                            <SelectValue placeholder={t("selectType")}>
                                {formData.type
                                    ? tTypes(
                                          getRequestTypeTranslationKey(formData.type as RequestType)
                                      )
                                    : t("selectType")}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {REQUEST_TYPES.map((rt) => (
                                <SelectItem key={rt.value} value={rt.value}>
                                    {tTypes(getRequestTypeTranslationKey(rt.value))}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <div className="text-lg">
                        {tTypes(getRequestTypeTranslationKey(request!.type))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="startDate">{tCommon("fields.startDate")}</Label>
                    {isEditable ? (
                        formData.isFullDay ? (
                            <DatePicker
                                date={formData.startDate ? new Date(formData.startDate) : undefined}
                                onDateChange={(date) =>
                                    setFormData({
                                        startDate: date ? format(date, "yyyy-MM-dd") : "",
                                    })
                                }
                                placeholder={t("selectStartDate")}
                            />
                        ) : (
                            <DateTimePicker
                                value={
                                    formData.startDate
                                        ? new Date(
                                              `${formData.startDate}T${formData.startTime || "00:00"}:00`
                                          )
                                        : undefined
                                }
                                onChange={(date) => {
                                    if (date) {
                                        setFormData({
                                            startDate: format(date, "yyyy-MM-dd"),
                                            startTime: format(date, "HH:mm"),
                                        })
                                    }
                                }}
                                modal={true}
                                hideTime={false}
                                timePicker={{ hour: true, minute: true, second: false }}
                            />
                        )
                    ) : (
                        request && (
                            <div className="text-lg">
                                {formatDate(request.startDate)}
                                {request.startTime && (
                                    <span className="text-sm text-muted-foreground ml-2">
                                        {request.startTime}
                                    </span>
                                )}
                            </div>
                        )
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="endDate">{tCommon("fields.endDate")}</Label>
                    {isEditable ? (
                        formData.isFullDay ? (
                            <DatePicker
                                date={formData.endDate ? new Date(formData.endDate) : undefined}
                                onDateChange={(date) =>
                                    setFormData({
                                        endDate: date ? format(date, "yyyy-MM-dd") : "",
                                    })
                                }
                                placeholder={t("selectEndDate")}
                            />
                        ) : (
                            <DateTimePicker
                                value={
                                    formData.endDate
                                        ? new Date(
                                              `${formData.endDate}T${formData.endTime || "00:00"}:00`
                                          )
                                        : undefined
                                }
                                onChange={(date) => {
                                    if (date) {
                                        setFormData({
                                            endDate: format(date, "yyyy-MM-dd"),
                                            endTime: format(date, "HH:mm"),
                                        })
                                    }
                                }}
                                modal={true}
                                hideTime={false}
                                timePicker={{ hour: true, minute: true, second: false }}
                            />
                        )
                    ) : (
                        request && (
                            <div className="text-lg">
                                {formatDate(request.endDate)}
                                {request.endTime && (
                                    <span className="text-sm text-muted-foreground ml-2">
                                        {request.endTime}
                                    </span>
                                )}
                            </div>
                        )
                    )}
                </div>
            </div>

            {isEditable && (
                <>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="full-day"
                            checked={formData.isFullDay}
                            onCheckedChange={(checked) =>
                                setFormData({ isFullDay: checked === true })
                            }
                        />
                        <Label htmlFor="full-day" className="cursor-pointer font-normal">
                            {t("fullDay")}
                        </Label>
                    </div>

                    {requestedHours !== null && !formData.isFullDay && (
                        <div className="text-sm text-muted-foreground">
                            {t("requestedHours")}: {requestedHours.toFixed(2)} {t("hours")}
                        </div>
                    )}
                </>
            )}

            {!isEditable && request && !request.isFullDay && request.requestedHours !== null && (
                <div className="space-y-2">
                    <Label>{t("requestedHours")}</Label>
                    <div className="text-lg">
                        {request.requestedHours.toFixed(2)} {t("hours")}
                    </div>
                </div>
            )}

            {(needsLocation || request?.location) && (
                <div className="space-y-2">
                    <Label htmlFor="location">{tCommon("fields.location")}</Label>
                    {isEditable ? (
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData({ location: e.target.value })}
                            placeholder={t("enterLocation")}
                        />
                    ) : (
                        request?.location && <div className="text-lg">{request.location}</div>
                    )}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="reason">{tCommon("fields.reason")}</Label>
                {isEditable ? (
                    <Input
                        id="reason"
                        value={formData.reason}
                        onChange={(e) => setFormData({ reason: e.target.value })}
                        placeholder={t("enterReason")}
                    />
                ) : (
                    request?.reason && <div className="text-lg">{request.reason}</div>
                )}
            </div>

            {request?.status === REQUEST_STATUS.REJECTED && request.rejectionReason && (
                <div className="space-y-2">
                    <Label className="text-red-600">{t("rejectRequest")}</Label>
                    <div className="text-lg text-red-600">{request.rejectionReason}</div>
                </div>
            )}

            {request?.status === REQUEST_STATUS.CANCELLED && (
                <>
                    {request.cancellationReason && (
                        <div className="space-y-2">
                            <Label className="text-gray-600">{t("cancellationReason")}</Label>
                            <div className="text-lg text-gray-600">
                                {request.cancellationReason}
                            </div>
                        </div>
                    )}
                    {request.canceller && (
                        <div className="space-y-2">
                            <Label>{tCommon("fields.user")}</Label>
                            <div className="text-lg">
                                {request.canceller.name || request.canceller.email}
                            </div>
                        </div>
                    )}
                    {request.cancelledAt && (
                        <div className="space-y-2">
                            <Label>{tCommon("fields.date")}</Label>
                            <div className="text-lg">
                                {new Date(request.cancelledAt).toLocaleString()}
                            </div>
                        </div>
                    )}
                </>
            )}

            {isEditable &&
                !request &&
                hasUrnikCredentials &&
                formData.type &&
                formData.type !== "WORK" && (
                    <div className="space-y-2 rounded-md border border-border p-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="send-to-urnik"
                                checked={formData.sendToUrnikNet}
                                onCheckedChange={(checked) =>
                                    setFormData({ sendToUrnikNet: checked === true })
                                }
                            />
                            <Label htmlFor="send-to-urnik" className="cursor-pointer font-normal">
                                {t("sendToUrnikNet")}
                            </Label>
                        </div>
                        {formData.sendToUrnikNet && (
                            <p className="text-sm text-muted-foreground">{t("urnikNetNote")}</p>
                        )}
                    </div>
                )}

            {isEditable && (
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        disabled={
                            isPending || !formData.type || !formData.startDate || !formData.endDate
                        }
                    >
                        {isPending ? tCommon("status.saving") : tCommon("actions.save")}
                    </Button>
                </div>
            )}
        </form>
    )
}
