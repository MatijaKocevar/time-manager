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
import { cancelApprovedRequest } from "../../../requests/actions/request-actions"
import { requestKeys } from "../../../requests/query-keys"

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
}

const typeLabels: Record<string, string> = {
    VACATION: "Vacation",
    SICK_LEAVE: "Sick Leave",
    WORK_FROM_HOME: "Work From Home",
    REMOTE_WORK: "Remote Work",
    OTHER: "Other",
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

function Filter({ column }: { column: Column<RequestDisplay, unknown> }) {
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
                            <DialogTitle>Filter Column</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="filter-input">Search</Label>
                                <Input
                                    id="filter-input"
                                    value={filterValue}
                                    onChange={(e) => setFilterValue(e.target.value)}
                                    placeholder={`Search... (${uniqueValues.size})`}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={handleClearFilter}>
                                Clear
                            </Button>
                            <Button onClick={handleApplyFilter}>Apply</Button>
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
            placeholder={`Search... (${uniqueValues.size})`}
            className="h-8"
        />
    )
}

export function RequestsHistoryList({ requests, holidays }: RequestsHistoryListProps) {
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

    const columns: ColumnDef<RequestDisplay>[] = [
        {
            id: "user",
            accessorFn: (row) => row.user.name || row.user.email,
            header: "User",
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
            accessorFn: (row) => typeLabels[row.type],
            header: "Type",
            cell: ({ row }) => (
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
                        typeColors[row.original.type]
                    }`}
                >
                    {typeLabels[row.original.type]}
                </span>
            ),
            enableColumnFilter: true,
            filterFn: "includesString",
        },
        {
            accessorKey: "startDate",
            header: "Start Date",
            cell: ({ row }) => formatDate(row.original.startDate),
            enableColumnFilter: false,
        },
        {
            accessorKey: "endDate",
            header: "End Date",
            cell: ({ row }) => formatDate(row.original.endDate),
            enableColumnFilter: false,
        },
        {
            id: "hours",
            header: "Hours",
            cell: ({ row }) => {
                const workdays = calculateWorkdays(row.original.startDate, row.original.endDate, holidays)
                const hours = workdays * 8
                return (
                    <div className="font-semibold">
                        {hours}h ({workdays}d)
                    </div>
                )
            },
            enableColumnFilter: false,
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        statusColors[row.original.status]
                    }`}
                >
                    {row.original.status}
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
            header: "Processed By",
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
            header: "Reason",
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
            header: "Actions",
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
                        <DialogTitle>Cancel Approved Request</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Are you sure you want to cancel this approved request? This will:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                <li>Mark the request as cancelled</li>
                                <li>Remove auto-generated hour entries</li>
                                <li>Recalculate daily summaries</li>
                            </ul>
                        </div>
                        {selectedRequest && (
                            <div className="space-y-2 p-3 bg-muted rounded-md">
                                <div className="text-sm">
                                    <span className="font-semibold">User: </span>
                                    {selectedRequest.user.name || selectedRequest.user.email}
                                </div>
                                <div className="text-sm">
                                    <span className="font-semibold">Type: </span>
                                    {typeLabels[selectedRequest.type]}
                                </div>
                                <div className="text-sm">
                                    <span className="font-semibold">Period: </span>
                                    {formatDate(selectedRequest.startDate)} -{" "}
                                    {formatDate(selectedRequest.endDate)}
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="cancellation-reason">
                                Cancellation Reason <span className="text-red-600">*</span>
                            </Label>
                            <Textarea
                                id="cancellation-reason"
                                value={cancellationReason}
                                onChange={(e) => setCancellationReason(e.target.value)}
                                placeholder="Explain why this request is being cancelled..."
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
                            Close
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancelConfirm}
                            disabled={!cancellationReason.trim() || cancelMutation.isPending}
                        >
                            {cancelMutation.isPending ? "Cancelling..." : "Cancel Request"}
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
                                                        <Filter column={header.column} />
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
                                                        <Filter column={header.column} />
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
                                        No request history found.
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
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </>
    )
}
