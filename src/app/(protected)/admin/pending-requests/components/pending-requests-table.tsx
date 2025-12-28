"use client"

import { Fragment, useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
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
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
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
import { ColumnFilter } from "./column-filter"
import { RejectDialog } from "./reject-dialog"
import { createColumns } from "../utils/columns"
import { usePendingRequestsStore } from "../stores/pending-requests-store"
import type { RequestDisplay, PendingRequestTranslations } from "../types"

interface PendingRequestsTableProps {
    requests: RequestDisplay[]
    holidays: Array<{ date: Date; name: string }>
    translations: PendingRequestTranslations
    locale: string
}

export function PendingRequestsTable({
    requests,
    holidays,
    translations,
    locale,
}: PendingRequestsTableProps) {
    const queryClient = useQueryClient()
    const isMobile = useIsMobile()
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

    const rejectDialogOpen = usePendingRequestsStore((state) => state.rejectDialogOpen)
    const selectedRequestId = usePendingRequestsStore((state) => state.selectedRequestId)
    const rejectionReason = usePendingRequestsStore((state) => state.rejectionReason)
    const setRejectionReason = usePendingRequestsStore((state) => state.setRejectionReason)
    const openRejectDialog = usePendingRequestsStore((state) => state.openRejectDialog)
    const setRejectDialogOpen = usePendingRequestsStore((state) => state.setRejectDialogOpen)
    const resetRejectDialog = usePendingRequestsStore((state) => state.resetRejectDialog)

    const [approvingId, setApprovingId] = useState<string | null>(null)

    const approveMutation = useMutation({
        mutationFn: approveRequest,
        onMutate: async (variables) => {
            setApprovingId(variables.id)
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
            setApprovingId(null)
            queryClient.invalidateQueries({ queryKey: requestKeys.adminRequests() })
        },
    })

    const rejectMutation = useMutation({
        mutationFn: rejectRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: requestKeys.all })
            resetRejectDialog()
        },
    })

    const columns = useMemo(
        () =>
            createColumns({
                translations,
                holidays,
                locale,
                isApproving: approveMutation.isPending,
                isRejecting: rejectMutation.isPending,
                approvingId,
                onApprove: (requestId: string) => approveMutation.mutate({ id: requestId }),
                onReject: openRejectDialog,
            }),
        [
            approveMutation.isPending,
            approveMutation.mutate,
            rejectMutation.isPending,
            approvingId,
            holidays,
            translations,
            locale,
            openRejectDialog,
        ]
    )

    const handleReject = () => {
        if (!rejectionReason || !selectedRequestId) return
        rejectMutation.mutate({ id: selectedRequestId, rejectionReason })
    }

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
                                                        <ColumnFilter
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
                                                        <ColumnFilter
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

            <RejectDialog
                open={rejectDialogOpen}
                onOpenChange={setRejectDialogOpen}
                rejectionReason={rejectionReason}
                onReasonChange={setRejectionReason}
                onConfirm={handleReject}
                isPending={rejectMutation.isPending}
                translations={translations.reject}
            />
        </>
    )
}
