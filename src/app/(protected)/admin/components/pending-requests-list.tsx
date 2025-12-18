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
import { approveRequest, rejectRequest } from "../../requests/actions/request-actions"
import { requestKeys } from "../../requests/query-keys"
import { getRequestTypeTranslationKey } from "../../requests/utils/translation-helpers"
import type { RequestType } from "../../requests/schemas/request-schemas"

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
    translations: {
        table: {
            user: string
            type: string
            startDate: string
            endDate: string
            hours: string
            days: string
            reason: string
            actions: string
            approve: string
            reject: string
            approving: string
            rejecting: string
            noPending: string
            searchPlaceholder: string
        }
        reject: {
            title: string
            confirmQuestion: string
            user: string
            type: string
            period: string
            reason: string
            reasonRequired: string
            reasonPlaceholder: string
            cancel: string
            rejecting: string
            rejectRequest: string
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
    }
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

function Filter({
    column,
    translations,
}: {
    column: Column<RequestDisplay, unknown>
    translations: PendingRequestsListProps["translations"]
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

export function PendingRequestsList({
    requests,
    holidays,
    translations,
}: PendingRequestsListProps) {
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

    const typeColors: Record<string, string> = {
        VACATION: "bg-blue-100 text-blue-800",
        SICK_LEAVE: "bg-red-100 text-red-800",
        WORK_FROM_HOME: "bg-green-100 text-green-800",
        REMOTE_WORK: "bg-purple-100 text-purple-800",
        OTHER: "bg-gray-100 text-gray-800",
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

    const columns: ColumnDef<RequestDisplay>[] = useMemo(
        () => [
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
                    return `${workdays * 8}h`
                },
                enableColumnFilter: false,
            },
            {
                accessorKey: "reason",
                header: translations.table.reason,
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
                header: () => (
                    <div className="text-right w-[170px]">{translations.table.actions}</div>
                ),
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
                                translations.table.approve
                            )}
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectClick(row.original.id)}
                            disabled={rejectMutation.isPending}
                            className="w-[76px]"
                        >
                            {translations.table.reject}
                        </Button>
                    </div>
                ),
                enableColumnFilter: false,
                size: 170,
                minSize: 170,
                maxSize: 170,
            },
        ],
        [approveMutation.isPending, rejectMutation.isPending, holidays, translations]
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
                                        {translations.table.noPending}
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

            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{translations.reject.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="rejectionReason">{translations.reject.reason}</Label>
                            <Input
                                id="rejectionReason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder={translations.reject.reasonPlaceholder}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRejectDialogOpen(false)}
                            disabled={rejectMutation.isPending}
                        >
                            {translations.reject.cancel}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={rejectMutation.isPending || !rejectionReason}
                        >
                            {rejectMutation.isPending
                                ? translations.reject.rejecting
                                : translations.reject.rejectRequest}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
