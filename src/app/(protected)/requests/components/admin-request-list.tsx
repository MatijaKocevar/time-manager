"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAllRequests, approveRequest, rejectRequest } from "../actions/request-actions"
import { requestKeys } from "../query-keys"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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

export function AdminRequestList() {
    const queryClient = useQueryClient()
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [selectedRequestId, setSelectedRequestId] = useState<string>("")
    const [rejectionReason, setRejectionReason] = useState<string>("")

    const { data: requests, isLoading } = useQuery({
        queryKey: requestKeys.adminRequests(),
        queryFn: getAllRequests,
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
            setSelectedRequestId("")
        },
    })

    const handleApprove = (id: string) => {
        approveMutation.mutate({ id })
    }

    const openRejectDialog = (id: string) => {
        setSelectedRequestId(id)
        setRejectDialogOpen(true)
    }

    const handleReject = () => {
        if (!selectedRequestId) return
        rejectMutation.mutate({
            id: selectedRequestId,
            rejectionReason,
        })
    }

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString()
    }

    if (isLoading) {
        return <div>Loading...</div>
    }

    return (
        <>
            <Card>
                <CardContent className="pt-6">
                    {!requests || requests.length === 0 ? (
                        <p className="text-sm text-gray-500">No requests</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>End Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell>
                                            {request.user?.name || request.user?.email || "Unknown"}
                                        </TableCell>
                                        <TableCell>{typeLabels[request.type]}</TableCell>
                                        <TableCell>{formatDate(request.startDate)}</TableCell>
                                        <TableCell>{formatDate(request.endDate)}</TableCell>
                                        <TableCell>
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium ${
                                                    statusColors[request.status]
                                                }`}
                                            >
                                                {request.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">
                                            {request.reason || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {request.status === "PENDING" && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleApprove(request.id)}
                                                        disabled={approveMutation.isPending}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => openRejectDialog(request.id)}
                                                        disabled={rejectMutation.isPending}
                                                    >
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                            {request.status === "REJECTED" &&
                                                request.rejectionReason && (
                                                    <span className="text-xs text-red-600">
                                                        {request.rejectionReason}
                                                    </span>
                                                )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

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
