"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { cancelRequest, updateRequest, createRequest } from "../actions/request-actions"
import { requestKeys } from "../query-keys"
import { REQUEST_TYPES, REQUEST_STATUS_COLORS, REQUEST_STATUS, REQUEST_TYPE } from "../constants"
import { useRequestStore } from "../stores/request-store"
import { type RequestType, type RequestDisplay } from "../schemas/request-schemas"
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
import { useEffect } from "react"
import { format } from "date-fns"
import {
    getRequestTypeTranslationKey,
    getRequestStatusTranslationKey,
} from "../utils/translation-helpers"

interface RequestDetailFormProps {
    request?: RequestDisplay
    onSuccess?: () => void
}

export function RequestDetailForm({ request, onSuccess }: RequestDetailFormProps) {
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
                onSuccess?.()
            }
        },
    })

    const createMutation = useMutation({
        mutationFn: createRequest,
        onSuccess: (result) => {
            if (result.success) {
                queryClient.invalidateQueries({ queryKey: requestKeys.all })
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

    const isEditable = !request || request.status === REQUEST_STATUS.PENDING
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

            <div className="space-y-2">
                <Label htmlFor="type">{tCommon("fields.type")}</Label>
                {isEditable ? (
                    <Select
                        value={formData.type || (request?.type ?? "")}
                        onValueChange={(value) => setFormData({ type: value as RequestType })}
                    >
                        <SelectTrigger id="type">
                            <SelectValue>
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
                        <>
                            <DatePicker
                                date={formData.startDate ? new Date(formData.startDate) : undefined}
                                onDateChange={(date) =>
                                    setFormData({
                                        startDate: date ? format(date, "yyyy-MM-dd") : "",
                                    })
                                }
                                placeholder={t("selectStartDate")}
                            />
                        </>
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
                        <>
                            <DatePicker
                                date={formData.endDate ? new Date(formData.endDate) : undefined}
                                onDateChange={(date) =>
                                    setFormData({
                                        endDate: date ? format(date, "yyyy-MM-dd") : "",
                                    })
                                }
                                placeholder={t("selectEndDate")}
                            />
                        </>
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

                    {!formData.isFullDay && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startTime">{t("startTime")}</Label>
                                <Select
                                    value={formData.startTime}
                                    onValueChange={(value) => setFormData({ startTime: value })}
                                >
                                    <SelectTrigger id="startTime">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 24 }, (_, i) => {
                                            const hour = i.toString().padStart(2, "0")
                                            return ["00", "15", "30", "45"].map((min) => {
                                                const time = `${hour}:${min}`
                                                return (
                                                    <SelectItem key={time} value={time}>
                                                        {time}
                                                    </SelectItem>
                                                )
                                            })
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endTime">{t("endTime")}</Label>
                                <Select
                                    value={formData.endTime}
                                    onValueChange={(value) => setFormData({ endTime: value })}
                                >
                                    <SelectTrigger id="endTime">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 24 }, (_, i) => {
                                            const hour = i.toString().padStart(2, "0")
                                            return ["00", "15", "30", "45"].map((min) => {
                                                const time = `${hour}:${min}`
                                                return (
                                                    <SelectItem key={time} value={time}>
                                                        {time}
                                                    </SelectItem>
                                                )
                                            })
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

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
