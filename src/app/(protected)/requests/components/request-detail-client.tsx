"use client"

import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { cancelRequest, updateRequest } from "../actions/request-actions"
import { requestKeys } from "../query-keys"
import {
    REQUEST_TYPES,
    REQUEST_TYPE_LABELS,
    REQUEST_STATUS_COLORS,
    REQUEST_STATUS,
    REQUEST_TYPE,
} from "../constants"
import { useRequestStore } from "../stores/request-store"
import { type RequestType, type RequestDisplay } from "../schemas/request-schemas"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect } from "react"

interface RequestDetailClientProps {
    request: RequestDisplay
}

export function RequestDetailClient({ request }: RequestDetailClientProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const formData = useRequestStore((state) => state.formData)
    const setFormData = useRequestStore((state) => state.setFormData)

    useEffect(() => {
        setFormData({
            type: request.type,
            startDate: new Date(request.startDate).toISOString().split("T")[0],
            endDate: new Date(request.endDate).toISOString().split("T")[0],
            reason: request.reason || "",
            location: request.location || "",
        })
    }, [request, setFormData])

    const updateMutation = useMutation({
        mutationFn: updateRequest,
        onSuccess: (result) => {
            if (result.success) {
                queryClient.invalidateQueries({ queryKey: requestKeys.all })
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
        cancelMutation.mutate({ id: request.id })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.type || !formData.startDate || !formData.endDate) return

        updateMutation.mutate({
            id: request.id,
            type: formData.type as RequestType,
            startDate: formData.startDate,
            endDate: formData.endDate,
            reason: formData.reason,
            location: formData.type === REQUEST_TYPE.REMOTE_WORK ? formData.location : undefined,
        })
    }

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString()
    }

    const isEditable = request.status === REQUEST_STATUS.PENDING
    const canCancel = request.status === REQUEST_STATUS.PENDING
    const needsLocation = formData.type === REQUEST_TYPE.REMOTE_WORK

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
                        REQUEST_STATUS_COLORS[request.status]
                    }`}
                >
                    {request.status}
                </span>
                <div className="flex gap-2">
                    {canCancel && (
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={cancelMutation.isPending}
                        >
                            Cancel Request
                        </Button>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                {isEditable ? (
                    <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ type: value as RequestType })}
                    >
                        <SelectTrigger id="type">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            {REQUEST_TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <div className="text-lg">{REQUEST_TYPE_LABELS[request.type]}</div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    {isEditable ? (
                        <Input
                            id="startDate"
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ startDate: e.target.value })}
                        />
                    ) : (
                        <div className="text-lg">{formatDate(request.startDate)}</div>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    {isEditable ? (
                        <Input
                            id="endDate"
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ endDate: e.target.value })}
                        />
                    ) : (
                        <div className="text-lg">{formatDate(request.endDate)}</div>
                    )}
                </div>
            </div>

            {(needsLocation || request.location) && (
                <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    {isEditable ? (
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData({ location: e.target.value })}
                            placeholder="Enter location"
                        />
                    ) : (
                        <div className="text-lg">{request.location}</div>
                    )}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                {isEditable ? (
                    <Input
                        id="reason"
                        value={formData.reason}
                        onChange={(e) => setFormData({ reason: e.target.value })}
                        placeholder="Enter reason (optional)"
                    />
                ) : request.reason ? (
                    <div className="text-lg">{request.reason}</div>
                ) : null}
            </div>

            {request.status === REQUEST_STATUS.REJECTED && request.rejectionReason && (
                <div className="space-y-2">
                    <Label className="text-red-600">Rejection Reason</Label>
                    <div className="text-lg text-red-600">{request.rejectionReason}</div>
                </div>
            )}

            {request.status === REQUEST_STATUS.CANCELLED && (
                <>
                    {request.cancellationReason && (
                        <div className="space-y-2">
                            <Label className="text-gray-600">Cancellation Reason</Label>
                            <div className="text-lg text-gray-600">
                                {request.cancellationReason}
                            </div>
                        </div>
                    )}
                    {request.canceller && (
                        <div className="space-y-2">
                            <Label>Cancelled By</Label>
                            <div className="text-lg">
                                {request.canceller.name || request.canceller.email}
                            </div>
                        </div>
                    )}
                    {request.cancelledAt && (
                        <div className="space-y-2">
                            <Label>Cancelled At</Label>
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
                            updateMutation.isPending ||
                            !formData.type ||
                            !formData.startDate ||
                            !formData.endDate
                        }
                    >
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            )}
        </form>
    )
}
