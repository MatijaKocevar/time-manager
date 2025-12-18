"use client"

import { Fragment, useEffect, useState } from "react"
import {
    Column,
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from "@tanstack/react-table"
import { Search, X } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useIsMobile } from "@/hooks/use-mobile"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cancelApprovedRequest } from "../../requests/actions/request-actions"
import { requestKeys } from "../../requests/query-keys"
import {
    getRequestTypeTranslationKey,
    getRequestStatusTranslationKey,
} from "../../requests/utils/translation-helpers"
import type { RequestType, RequestStatus } from "../../requests/schemas/request-schemas"

type RequestDisplay = {
    id: string
    type: string
    startDate: Date
    endDate: Date
    reason: string | null
    location: string | null
    status: string
    user: {
        name: string | null
        email: string
    }
    approver?: {
        id: string
        name: string | null
        email: string
    } | null
    rejector?: {
        id: string
        name: string | null
        email: string
    } | null
    canceller?: {
        id: string
        name: string | null
        email: string
    } | null
    rejectionReason?: string | null
    cancellationReason?: string | null
    cancelledAt?: Date | null
}

interface RequestsHistoryListProps {
    requests: RequestDisplay[]
    holidays: Array<{ date: Date; name: string }>
    translations: {
        table: {
            user: string
            type: string
            startDate: string
            endDate: string
            hours: string
            days: string
            status: string
            processedBy: string
            reason: string
            actions: string
            noHistory: string
            searchPlaceholder: string
        }
        cancel: {
            title: string
            confirmQuestion: string
            markCancelled: string
            removeHours: string
            recalculate: string
            user: string
            type: string
            period: string
            reason: string
            reasonRequired: string
            reasonPlaceholder: string
            close: string
            cancelling: string
            cancelRequest: string
        }
        pagination: {
            previous: string
            next: string
        }
        filter: {
            title: string
            search: string
            clear: string
            apply: string
        }
        types: {
            vacation: string
            sickLeave: string
            workFromHome: string
            other: string
        }
        statuses: {
            approved: string
            rejected: string
            cancelled: string
        }
    }
}

const calculateWorkdays = (
    startDate: Date,
    endDate: Date,
    holidays: Array<{ date: Date; name: string }>
): number => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    let count = 0

    const holidayDates = new Set(
        holidays.map((h) => {
            const d = new Date(h.date)
            d.setHours(0, 0, 0, 0)
            return d.getTime()
        })
    )

    const current = new Date(start)
    while (current <= end) {
        const day = current.getDay()
        const currentTime = new Date(current)
        currentTime.setHours(0, 0, 0, 0)
        const isHoliday = holidayDates.has(currentTime.getTime())

        if (day !== 0 && day !== 6 && !isHoliday) {
            count++
        }
        current.setDate(current.getDate() + 1)
    }

    return count
}

function DebouncedInput({
    value: initialValue,
    onChange,
    debounce = 500,
    ...props
}: {
    value: string | number
    onChange: (value: string | number) => void
    debounce?: number
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
    const [value, setValue] = useState(initialValue)

    useEffect(() => {
        setValue(initialValue)
    }, [initialValue])

    useEffect(() => {
        const timeout = setTimeout(() => {
            onChange(value)
        }, debounce)

        return () => clearTimeout(timeout)
    }, [value, onChange, debounce])

    return <Input {...props} value={value} onChange={(e) => setValue(e.target.value)} />
}

function Filter({
    column,
    translations,
}: {
    column: Column<RequestDisplay, unknown>
    translations: RequestsHistoryListProps["translations"]
}) {
    const columnFilterValue = column.getFilterValue()
    const uniqueValues = column.getFacetedUniqueValues()
    const isMobile = useIsMobile()
    const [filterDialogOpen, setFilterDialogOpen] = useState(false)
    const [filterValue, setFilterValue] = useState((columnFilterValue ?? "") as string)

    const hasActiveFilter = columnFilterValue && String(columnFilterValue).length > 0

    const handleApplyFilter = () => {
        column.setFilterValue(filterValue)
        setFilterDialogOpen(false)
    }

    const handleClearFilter = () => {
        setFilterValue("")
        column.setFilterValue("")
        setFilterDialogOpen(false)
    }

    const handleDialogOpen = (open: boolean) => {
        setFilterDialogOpen(open)
        if (open) {
            setFilterValue((columnFilterValue ?? "") as string)
        }
    }

    if (isMobile) {
        return (
            <>
                <button
                    onClick={() => setFilterDialogOpen(true)}
                    className="inline-flex items-center justify-center"
                    aria-label="Filter column"
                >
                    <Search
                        className={`h-4 w-4 ${
                            hasActiveFilter ? "text-primary" : "text-muted-foreground"
                        }`}
                    />
                </button>
                <Dialog open={filterDialogOpen} onOpenChange={handleDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{translations.filter.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="filter-input">{translations.filter.search}</Label>
                                <Input
                                    id="filter-input"
                                    value={filterValue}
                                    onChange={(e) => setFilterValue(e.target.value)}
                                    placeholder={`${translations.table.searchPlaceholder} (${uniqueValues.size})`}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={handleClearFilter}>
                                {translations.filter.clear}
                            </Button>
                            <Button onClick={handleApplyFilter}>{translations.filter.apply}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        )
    }

    return (
        <DebouncedInput
            type="text"
            value={(columnFilterValue ?? "") as string}
            onChange={(value) => column.setFilterValue(value)}
            placeholder={`${translations.table.searchPlaceholder} (${uniqueValues.size})`}
            className="h-8"
        />
    )
}

export function RequestsHistoryList({ requests, holidays, translations }: RequestsHistoryListProps) {
    const isMobile = useIsMobile()
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
    const [selectedRequest, setSelectedRequest] = useState<RequestDisplay | null>(null)
    const [cancellationReason, setCancellationReason] = useState("")
    const queryClient = useQueryClient()

    const cancelMutation = useMutation({
        mutationFn: (data: { id: string; cancellationReason: string }) =>
            cancelApprovedRequest(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: requestKeys.all })
            setCancelDialogOpen(false)
            setSelectedRequest(null)
            setCancellationReason("")
        },
    })

    const handleCancelClick = (request: RequestDisplay) => {
        setSelectedRequest(request)
        setCancellationReason("")
        setCancelDialogOpen(true)
    }

    const handleCancelConfirm = () => {
        if (selectedRequest && cancellationReason.trim()) {
            cancelMutation.mutate({
                id: selectedRequest.id,
                cancellationReason: cancellationReason.trim(),
            })
        }
    }

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString()
    }

    const typeColors: Record<string, string> = {
        VACATION: "bg-blue-100 text-blue-800",
        SICK_LEAVE: "bg-red-100 text-red-800",
        WORK_FROM_HOME: "bg-green-100 text-green-800",
        REMOTE_WORK: "bg-purple-100 text-purple-800",
        OTHER: "bg-gray-100 text-gray-800",
    }

    const statusColors: Record<string, string> = {
        APPROVED: "bg-green-100 text-green-800",
        REJECTED: "bg-red-100 text-red-800",
        CANCELLED: "bg-gray-100 text-gray-800",
    }

    const getTypeTranslation = (type: RequestType) => {
        const key = getRequestTypeTranslationKey(type)
        const typeMap: Record<string, string> = {
            vacation: translations.types.vacation,
            sickLeave: translations.types.sickLeave,
            workFromHome: translations.types.workFromHome,
            other: translations.types.other,
        }
        return typeMap[key] || key
    }

    const getStatusTranslation = (status: RequestStatus) => {
        const key = getRequestStatusTranslationKey(status)
        const statusMap: Record<string, string> = {
            approved: translations.statuses.approved,
            rejected: translations.statuses.rejected,
            cancelled: translations.statuses.cancelled,
        }
        return statusMap[key] || key
    }

    const columns: ColumnDef<RequestDisplay>[] = [
        {
            id: "user",
            accessorFn: (row) => row.user.name || row.user.email,
            header: translations.table.user,
            cell: ({ row }) => (
                <div className="font-medium">
                    {row.original.user.name || row.original.user.email}
                </div>
            ),
            enableColumnFilter: true,
            filterFn: "includesString",
        },
        {
            id: "type",
            accessorFn: (row) => getTypeTranslation(row.type as RequestType),
            header: translations.table.type,
            cell: ({ row }) => (
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
                        typeColors[row.original.type]
                    }`}
                >
                    {getTypeTranslation(row.original.type as RequestType)}
                </span>
            ),
            enableColumnFilter: true,
            filterFn: "includesString",
        },
        {
            accessorKey: "startDate",
            header: translations.table.startDate,
            cell: ({ row }) => formatDate(row.original.startDate),
            enableColumnFilter: false,
        },
        {
            accessorKey: "endDate",
            header: translations.table.endDate,
            cell: ({ row }) => formatDate(row.original.endDate),
            enableColumnFilter: false,
        },
        {
            id: "hours",
            header: translations.table.hours,
            cell: ({ row }) => {
                const workdays = calculateWorkdays(
                    row.original.startDate,
                    row.original.endDate,
                    holidays
                )
                const hours = workdays * 8
                return (
                    <div className="font-semibold">
                        {hours}h ({workdays}
                        {translations.table.days})
                    </div>
                )
            },
            enableColumnFilter: false,
        },
        {
            accessorKey: "status",
            header: translations.table.status,
            cell: ({ row }) => (
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        statusColors[row.original.status]
                    }`}
                >
                    {getStatusTranslation(row.original.status as RequestStatus)}
                </span>
            ),
            enableColumnFilter: true,
            filterFn: "includesString",
        },
        {
            id: "processedBy",
            accessorFn: (row) => {
                const processor = row.approver || row.rejector || row.canceller
                return processor?.name || processor?.email || "-"
            },
            header: translations.table.processedBy,
            cell: ({ row }) => {
                const processor =
                    row.original.approver || row.original.rejector || row.original.canceller
                return <div className="text-sm">{processor?.name || processor?.email || "-"}</div>
            },
            enableColumnFilter: true,
            filterFn: "includesString",
        },
        {
            accessorKey: "reason",
            header: translations.table.reason,
            cell: ({ row }) => (
                <div className="text-sm text-muted-foreground">
                    {row.original.cancellationReason ||
                        row.original.rejectionReason ||
                        row.original.reason ||
                        "-"}
                </div>
            ),
            enableColumnFilter: true,
            filterFn: "includesString",
        },
        {
            id: "actions",
            header: translations.table.actions,
            cell: ({ row }) => {
                if (row.original.status === "APPROVED") {
                    return (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelClick(row.original)}
                            className="h-8 w-8 p-0"
                            aria-label="Cancel request"
                        >
                            <X className="h-4 w-4 text-red-600" />
                        </Button>
                    )
                }
                return null
            },
            enableColumnFilter: false,
        },
    ]

    const table = useReactTable({
        data: requests,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        state: {
            sorting,
            columnFilters,
        },
    })

    return (
        <>
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{translations.cancel.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                {translations.cancel.confirmQuestion}
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                <li>{translations.cancel.markCancelled}</li>
                                <li>{translations.cancel.removeHours}</li>
                                <li>{translations.cancel.recalculate}</li>
                            </ul>
                        </div>
                        {selectedRequest && (
                            <div className="space-y-2 p-3 bg-muted rounded-md">
                                <div className="text-sm">
                                    <span className="font-semibold">{translations.cancel.user} </span>
                                    {selectedRequest.user.name || selectedRequest.user.email}
                                </div>
                                <div className="text-sm">
                                    <span className="font-semibold">{translations.cancel.type} </span>
                                    {getTypeTranslation(selectedRequest.type as RequestType)}
                                </div>
                                <div className="text-sm">
                                    <span className="font-semibold">{translations.cancel.period} </span>
                                    {formatDate(selectedRequest.startDate)} -{" "}
                                    {formatDate(selectedRequest.endDate)}
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="cancellation-reason">
                                {translations.cancel.reason}{" "}
                                <span className="text-red-600">{translations.cancel.reasonRequired}</span>
                            </Label>
                            <Textarea
                                id="cancellation-reason"
                                value={cancellationReason}
                                onChange={(e) => setCancellationReason(e.target.value)}
                                placeholder={translations.cancel.reasonPlaceholder}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setCancelDialogOpen(false)}
                            disabled={cancelMutation.isPending}
                        >
                            {translations.cancel.close}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancelConfirm}
                            disabled={!cancellationReason.trim() || cancelMutation.isPending}
                        >
                            {cancelMutation.isPending
                                ? translations.cancel.cancelling
                                : translations.cancel.cancelRequest}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <div className="flex flex-col gap-4 h-full min-w-0">
                <div className="rounded-md border flex-1 min-h-0">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <Fragment key={headerGroup.id}>
                                    <TableRow>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id} className="font-semibold">
                                                <div className="flex items-center gap-2">
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                              header.column.columnDef.header,
                                                              header.getContext()
                                                          )}
                                                    {isMobile && header.column.getCanFilter() && (
                                                        <Filter
                                                            column={header.column}
                                                            translations={translations}
                                                        />
                                                    )}
                                                </div>
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                    {!isMobile && (
                                        <TableRow>
                                            {headerGroup.headers.map((header) => (
                                                <TableHead
                                                    key={`${header.id}-filter`}
                                                    className="py-2"
                                                >
                                                    {header.column.getCanFilter() ? (
                                                        <Filter
                                                            column={header.column}
                                                            translations={translations}
                                                        />
                                                    ) : null}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    )}
                                </Fragment>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        {translations.table.noHistory}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-end space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        {translations.pagination.previous}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        {translations.pagination.next}
                    </Button>
                </div>
            </div>
        </>
    )
}
