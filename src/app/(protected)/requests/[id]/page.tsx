"use client"

import { useRouter, useParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import {
    getUserRequests,
    getAllRequests,
    approveRequest,
    rejectRequest,
    cancelRequest,
    updateRequest,
} from "../actions/request-actions"
import { requestKeys } from "../query-keys"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-800",
}

const typeLabels: Record<string, string> = {
    VACATION: "Vacation",
    SICK_LEAVE: "Sick Leave",
    WORK_FROM_HOME: "Work From Home",
    REMOTE_WORK: "Remote Work",
    OTHER: "Other",
}

const requestTypes = [
    { value: "VACATION", label: "Vacation" },
    { value: "SICK_LEAVE", label: "Sick Leave" },
    { value: "WORK_FROM_HOME", label: "Work From Home" },
    { value: "REMOTE_WORK", label: "Remote Work" },
    { value: "OTHER", label: "Other" },
]

export default function RequestDetailPage() {
    const router = useRouter()
    const params = useParams()
    const queryClient = useQueryClient()
    const { data: session } = useSession()
    const requestId = params.id as string

    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [rejectionReason, setRejectionReason] = useState<string>("")
    const [type, setType] = useState<string>("")
    const [startDate, setStartDate] = useState<string>("")
    const [endDate, setEndDate] = useState<string>("")
    const [reason, setReason] = useState<string>("")
    const [location, setLocation] = useState<string>("")
    const [initialized, setInitialized] = useState(false)

    const isAdmin = session?.user?.role === "ADMIN"

    const { data: requests } = useQuery({
        queryKey: isAdmin ? requestKeys.adminRequests() : requestKeys.userRequests(),
        queryFn: () => (isAdmin ? getAllRequests() : getUserRequests()),
    })

    const request = requests?.find((r) => r.id === requestId)

    if (request && !initialized) {
        setType(request.type)
        setStartDate(new Date(request.startDate).toISOString().split("T")[0])
        setEndDate(new Date(request.endDate).toISOString().split("T")[0])
        setReason(request.reason || "")
        setLocation(request.location || "")
        setInitialized(true)
    }

    const updateMutation = useMutation({
        mutationFn: updateRequest,
        onSuccess: (result) => {
            if (result.success) {
                queryClient.invalidateQueries({ queryKey: requestKeys.all })
            }
        },
    })

    const approveMutation = useMutation({
        mutationFn: approveRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: requestKeys.all })
        },
    })

    const rejectMutation = useMutation({
        mutationFn: rejectRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: requestKeys.all })
            setRejectDialogOpen(false)
            setRejectionReason("")
        },
    })

    const cancelMutation = useMutation({
        mutationFn: cancelRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: requestKeys.all })
            router.push("/requests")
        },
    })

    const handleApprove = () => {
        approveMutation.mutate({ id: requestId })
    }

    const handleReject = () => {
        if (!rejectionReason) return
        rejectMutation.mutate({ id: requestId, rejectionReason })
    }

    const handleCancel = () => {
        cancelMutation.mutate({ id: requestId })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!type || !startDate || !endDate) return

        updateMutation.mutate({
            id: requestId,
            type: type as "VACATION" | "SICK_LEAVE" | "WORK_FROM_HOME" | "REMOTE_WORK" | "OTHER",
            startDate,
            endDate,
            reason,
            location: type === "REMOTE_WORK" ? location : undefined,
        })
    }

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString()
    }

    if (!request) {
        return <div>Loading...</div>
    }

    const isEditable = request.status === "PENDING" && !isAdmin
    const canCancel = request.status === "PENDING" && !isAdmin
    const canApprove = request.status === "PENDING" && isAdmin
    const canReject = request.status === "PENDING" && isAdmin
    const needsLocation = type === "REMOTE_WORK"

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
                            statusColors[request.status]
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
                        {canApprove && (
                            <Button onClick={handleApprove} disabled={approveMutation.isPending}>
                                Approve
                            </Button>
                        )}
                        {canReject && (
                            <Button
                                variant="destructive"
                                onClick={() => setRejectDialogOpen(true)}
                                disabled={rejectMutation.isPending}
                            >
                                Reject
                            </Button>
                        )}
                    </div>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                {isEditable ? (
                                    <Select value={type} onValueChange={setType}>
                                        <SelectTrigger id="type">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {requestTypes.map((t) => (
                                                <SelectItem key={t.value} value={t.value}>
                                                    {t.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="text-lg">{typeLabels[request.type]}</div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Start Date</Label>
                                    {isEditable ? (
                                        <Input
                                            id="startDate"
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    ) : (
                                        <div className="text-lg">
                                            {formatDate(request.startDate)}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endDate">End Date</Label>
                                    {isEditable ? (
                                        <Input
                                            id="endDate"
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
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
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
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
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Enter reason (optional)"
                                    />
                                ) : request.reason ? (
                                    <div className="text-lg">{request.reason}</div>
                                ) : null}
                            </div>

                            {isAdmin && request.user && (
                                <div className="space-y-2">
                                    <Label>Requested By</Label>
                                    <div className="text-lg">
                                        {request.user.name || request.user.email}
                                    </div>
                                </div>
                            )}

                            {request.status === "REJECTED" && request.rejectionReason && (
                                <div className="space-y-2">
                                    <Label className="text-red-600">Rejection Reason</Label>
                                    <div className="text-lg text-red-600">
                                        {request.rejectionReason}
                                    </div>
                                </div>
                            )}

                            {isEditable && (
                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={
                                            updateMutation.isPending ||
                                            !type ||
                                            !startDate ||
                                            !endDate
                                        }
                                    >
                                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Request</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="rejectionReason">Rejection Reason</Label>
                            <Input
                                id="rejectionReason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Enter reason for rejection"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRejectDialogOpen(false)}
                            disabled={rejectMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={rejectMutation.isPending || !rejectionReason}
                        >
                            {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
