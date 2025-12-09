"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, Search, Plus } from "lucide-react"
import type { RequestDisplay } from "../schemas/request-schemas"

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

interface RequestsTableProps {
    requests: RequestDisplay[]
    showUser?: boolean
}

export function RequestsTable({ requests, showUser = false }: RequestsTableProps) {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("")

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString()
    }

    const handleRowDoubleClick = (request: RequestDisplay) => {
        router.push(`/requests/${request.id}`)
    }

    const filteredRequests = requests.filter((request) => {
        const searchLower = searchQuery.toLowerCase()
        return (
            typeLabels[request.type].toLowerCase().includes(searchLower) ||
            request.user?.name?.toLowerCase().includes(searchLower) ||
            request.user?.email?.toLowerCase().includes(searchLower) ||
            request.reason?.toLowerCase().includes(searchLower)
        )
    })

    const columnCount = showUser ? 8 : 7

    return (
        <>
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Filter requests..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button asChild>
                    <Link href="/requests/new">
                        <Plus className="h-4 w-4 mr-2" />
                        New Request
                    </Link>
                </Button>
            </div>
            <div className="rounded-md border overflow-auto flex-1 min-h-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {showUser && <TableHead className="min-w-[150px]">User</TableHead>}
                            <TableHead className="min-w-[150px]">Type</TableHead>
                            <TableHead className="min-w-[120px]">Start Date</TableHead>
                            <TableHead className="min-w-[120px]">End Date</TableHead>
                            <TableHead className="min-w-[100px]">Status</TableHead>
                            <TableHead className="min-w-[150px]">Approved/Rejected By</TableHead>
                            <TableHead className="min-w-[200px]">Reason</TableHead>
                            <TableHead className="text-right min-w-[180px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRequests.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columnCount}
                                    className="text-center text-muted-foreground"
                                >
                                    {searchQuery
                                        ? "No requests match your search"
                                        : "No requests found"}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRequests.map((request) => (
                                <TableRow
                                    key={request.id}
                                    onDoubleClick={() => handleRowDoubleClick(request)}
                                    className="cursor-pointer"
                                >
                                    {showUser && (
                                        <TableCell className="font-medium">
                                            {request.user?.name || request.user?.email || "Unknown"}
                                        </TableCell>
                                    )}
                                    <TableCell>{typeLabels[request.type]}</TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {formatDate(request.startDate)}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {formatDate(request.endDate)}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
                                                statusColors[request.status]
                                            }`}
                                        >
                                            {request.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {request.status === "APPROVED" && request.approver
                                            ? request.approver.name || request.approver.email
                                            : request.status === "REJECTED" && request.rejector
                                              ? request.rejector.name || request.rejector.email
                                              : request.status === "CANCELLED" && request.canceller
                                                ? request.canceller.name || request.canceller.email
                                                : "-"}
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">
                                        {request.cancellationReason ||
                                            request.rejectionReason ||
                                            request.reason ||
                                            "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link
                                                href={`/requests/${request.id}${request.status === "PENDING" ? "/edit" : ""}`}
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                {request.status === "PENDING" ? "Edit" : "View"}
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </>
    )
}
