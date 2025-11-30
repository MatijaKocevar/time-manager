"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUserRequests, cancelRequest } from "../actions/request-actions"
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

export function RequestList() {
    const queryClient = useQueryClient()

    const { data: requests, isLoading } = useQuery({
        queryKey: requestKeys.userRequests(),
        queryFn: getUserRequests,
    })

    const cancelMutation = useMutation({
        mutationFn: cancelRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: requestKeys.all })
        },
    })

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString()
    }

    if (isLoading) {
        return <div>Loading...</div>
    }

    return (
        <Card>
            <CardContent className="pt-6">
                {!requests || requests.length === 0 ? (
                    <p className="text-sm text-gray-500">No requests yet</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
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
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    cancelMutation.mutate({ id: request.id })
                                                }
                                                disabled={cancelMutation.isPending}
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
