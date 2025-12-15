"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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
import { Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { approveRequest, rejectRequest } from "../../../requests/actions/request-actions"
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
}

interface PendingRequestsListProps {
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

export function PendingRequestsList({ requests, holidays }: PendingRequestsListProps) {
    const queryClient = useQueryClient()
    const isMobile = useIsMobile()
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [selectedRequestId, setSelectedRequestId] = useState<string>("")
    const [rejectionReason, setRejectionReason] = useState<string>("")
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

    const approveMutation = useMutation({
        mutationFn: approveRequest,
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: requestKeys.all })
            const previousRequests = queryClient.getQueryData(requestKeys.all)
            queryClient.setQueryData(requestKeys.all, (old: RequestDisplay[] | undefined) => {
                if (!old) return old
                return old.filter((req) => req.id !== variables.id)
            })
            return { previousRequests }
        },
        onSuccess: (data) => {
            if (data.error) {
                console.error("Approval error:", data.error)
                alert(`Error: ${data.error}`)
                queryClient.invalidateQueries({ queryKey: requestKeys.all })
            }
        },
        onError: (error, _variables, context) => {
            console.error("Approval mutation error:", error)
            alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
            if (context?.previousRequests) {
                queryClient.setQueryData(requestKeys.all, context.previousRequests)
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: requestKeys.adminRequests() })
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

    const handleApprove = (requestId: string) => {
        approveMutation.mutate({ id: requestId })
    }

    const handleRejectClick = (requestId: string) => {
        setSelectedRequestId(requestId)
        setRejectDialogOpen(true)
    }

    const handleReject = () => {
        if (!rejectionReason || !selectedRequestId) return
        rejectMutation.mutate({ id: selectedRequestId, rejectionReason })
    }

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString()
    }

    const columns: ColumnDef<RequestDisplay>[] = useMemo(
        () => [
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
                    const workdays = calculateWorkdays(
                        row.original.startDate,
                        row.original.endDate,
                        holidays
                    )
                    return `${workdays * 8}h`
                },
                enableColumnFilter: false,
            },
            {
                accessorKey: "reason",
                header: "Reason",
                cell: ({ row }) => (
                    <div className="text-sm text-muted-foreground">
                        {row.original.reason || "-"}
                    </div>
                ),
                enableColumnFilter: true,
                filterFn: "includesString",
            },
            {
                id: "actions",
                header: () => <div className="text-right w-[170px]">Actions</div>,
                cell: ({ row }) => (
                    <div className="flex gap-2 justify-end w-[170px]">
                        <Button
                            size="sm"
                            onClick={() => handleApprove(row.original.id)}
                            disabled={approveMutation.isPending}
                            className="w-[84px]"
                        >
                            {approveMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Approve"
                            )}
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectClick(row.original.id)}
                            disabled={rejectMutation.isPending}
                            className="w-[76px]"
                        >
                            Reject
                        </Button>
                    </div>
                ),
                enableColumnFilter: false,
                size: 170,
                minSize: 170,
                maxSize: 170,
            },
        ],
        [approveMutation.isPending, rejectMutation.isPending, holidays]
    )

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
                                        No pending requests found.
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
