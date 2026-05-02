"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Search, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { WorkTypeBadge } from "@/components/work-type-badge"
import type { RequestDisplay } from "../schemas/request-schemas"
import { REQUEST_TYPE_LABELS, REQUEST_STATUS_COLORS, REQUEST_STATUS } from "../constants"
import {
    getRequestTypeTranslationKey,
    getRequestStatusTranslationKey,
} from "../utils/translation-helpers"
import type { WorkType } from "@/lib/work-type-styles"

interface RequestsTableProps {
    requests: RequestDisplay[]
    showUser?: boolean
    showNewButton?: boolean
    onRequestClick?: (request: RequestDisplay) => void
    onNewRequestClick?: () => void
}

export function RequestsTable({
    requests,
    showUser = false,
    showNewButton = true,
    onRequestClick,
    onNewRequestClick,
}: RequestsTableProps) {
    const t = useTranslations("requests")
    const tCommon = useTranslations("common")
    const tTypes = useTranslations("requests.types")
    const tStatuses = useTranslations("requests.statuses")
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)

    const formatDate = (date: Date) => {
        const d = new Date(date)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, "0")
        const day = String(d.getDate()).padStart(2, "0")
        return `${day}.${month}.${year}`
    }

    const formatDateTime = (date: Date, time?: string | null) => {
        const formattedDate = formatDate(date)
        return time ? `${formattedDate} ${time}` : formattedDate
    }

    const handleRowDoubleClick = (request: RequestDisplay) => {
        onRequestClick?.(request)
    }

    const filteredRequests = requests.filter((request) => {
        const searchLower = searchQuery.toLowerCase()
        return (
            REQUEST_TYPE_LABELS[request.type].toLowerCase().includes(searchLower) ||
            request.user?.name?.toLowerCase().includes(searchLower) ||
            request.user?.email?.toLowerCase().includes(searchLower) ||
            request.reason?.toLowerCase().includes(searchLower)
        )
    })

    const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize))
    const safePage = Math.min(currentPage, totalPages)
    const paginatedRequests = filteredRequests.slice((safePage - 1) * pageSize, safePage * pageSize)

    const columnCount = showUser ? 9 : 8

    return (
        <>
            <div id="requests-controls" className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={t("table.filterPlaceholder")}
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setCurrentPage(1)
                        }}
                        className="pl-9"
                    />
                </div>
                {showNewButton && (
                    <Button id="requests-new-btn" onClick={onNewRequestClick}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t("form.newRequest")}
                    </Button>
                )}
            </div>
            <div id="requests-table" className="rounded-md border overflow-auto flex-1 min-h-0">
                <Table>
                    <TableHeader className="sticky top-0 z-10 bg-background">
                        <TableRow>
                            {showUser && (
                                <TableHead className="min-w-[150px]">{t("table.user")}</TableHead>
                            )}
                            <TableHead className="min-w-[150px]">
                                {tCommon("fields.type")}
                            </TableHead>
                            <TableHead className="min-w-[120px]">
                                {tCommon("fields.startDate")}
                            </TableHead>
                            <TableHead className="min-w-[120px]">
                                {tCommon("fields.endDate")}
                            </TableHead>
                            <TableHead className="min-w-[100px]">{t("table.hours")}</TableHead>
                            <TableHead className="min-w-[100px]">
                                {tCommon("fields.status")}
                            </TableHead>
                            <TableHead className="min-w-[150px]">{t("table.approvedBy")}</TableHead>
                            <TableHead className="min-w-[200px]">
                                {tCommon("fields.reason")}
                            </TableHead>
                            <TableHead className="text-right min-w-[180px]">
                                {tCommon("fields.actions")}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedRequests.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columnCount}
                                    className="text-center text-muted-foreground"
                                >
                                    {searchQuery
                                        ? t("messages.noRequestsMatch")
                                        : t("table.noRequests")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedRequests.map((request) => (
                                <TableRow
                                    key={request.id}
                                    onDoubleClick={() => handleRowDoubleClick(request)}
                                    className="cursor-pointer"
                                >
                                    {showUser && (
                                        <TableCell className="font-medium">
                                            {request.user?.name ||
                                                request.user?.email ||
                                                t("table.unknown")}
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1 items-center">
                                            <WorkTypeBadge type={request.type as WorkType}>
                                                {tTypes(getRequestTypeTranslationKey(request.type))}
                                            </WorkTypeBadge>
                                            {request.urnikNetSynced && (
                                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 whitespace-nowrap">
                                                    Urnik.net
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {formatDateTime(request.startDate, request.startTime)}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {formatDateTime(request.endDate, request.endTime)}
                                    </TableCell>
                                    <TableCell>
                                        {request.requestedHours !== null &&
                                        request.requestedHours !== undefined
                                            ? (() => {
                                                  const totalHours = Number(request.requestedHours)
                                                  const hours = Math.floor(totalHours)
                                                  const minutes = Math.round(
                                                      (totalHours - hours) * 60
                                                  )
                                                  return minutes > 0
                                                      ? `${hours}h ${minutes}m`
                                                      : `${hours}h`
                                              })()
                                            : "-"}
                                    </TableCell>
                                    <TableCell>
                                        {request.urnikNetSynced &&
                                        request.urnikNetStatus === "PENDING" ? (
                                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                                Urnik.net pending
                                            </span>
                                        ) : request.urnikNetStatus === "FAILED" ? (
                                            <div className="flex flex-col gap-1">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
                                                        REQUEST_STATUS_COLORS[request.status]
                                                    }`}
                                                >
                                                    {tStatuses(
                                                        getRequestStatusTranslationKey(
                                                            request.status
                                                        )
                                                    )}
                                                </span>
                                                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                    Urnik.net sync failed
                                                </span>
                                            </div>
                                        ) : (
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
                                                    REQUEST_STATUS_COLORS[request.status]
                                                }`}
                                            >
                                                {tStatuses(
                                                    getRequestStatusTranslationKey(request.status)
                                                )}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {request.status === REQUEST_STATUS.APPROVED &&
                                        request.approver
                                            ? request.approver.name || request.approver.email
                                            : request.status === REQUEST_STATUS.REJECTED &&
                                                request.rejector
                                              ? request.rejector.name || request.rejector.email
                                              : request.status === REQUEST_STATUS.CANCELLED &&
                                                  request.canceller
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
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onRequestClick?.(request)}
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            {request.status === REQUEST_STATUS.PENDING
                                                ? t("table.edit")
                                                : t("table.view")}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between px-2 py-2 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{t("table.rowsPerPage")}</span>
                    <Select
                        value={String(pageSize)}
                        onValueChange={(v) => {
                            setPageSize(Number(v))
                            setCurrentPage(1)
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{t("table.pageOf", { page: safePage, total: totalPages })}</span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={safePage <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safePage >= totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </>
    )
}
