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
import { cancelApprovedRequest } from "../../../requests/actions/request-actions"
import { requestKeys } from "../../../requests/query-keys"
import { ColumnFilter } from "./column-filter"
import { CancelDialog } from "./cancel-dialog"
import { createColumns } from "../utils/columns"
import { useRequestHistoryStore } from "../stores/request-history-store"
import type { RequestDisplay, RequestHistoryTranslations } from "../types"

interface RequestHistoryTableProps {
    requests: RequestDisplay[]
    holidays: Array<{ date: Date; name: string }>
    translations: RequestHistoryTranslations
    locale: string
}

export function RequestHistoryTable({
    requests,
    holidays,
    translations,
    locale,
}: RequestHistoryTableProps) {
    const queryClient = useQueryClient()
    const isMobile = useIsMobile()
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

    const cancelDialogOpen = useRequestHistoryStore((state) => state.cancelDialogOpen)
    const selectedRequestId = useRequestHistoryStore((state) => state.selectedRequestId)
    const selectedRequestData = useRequestHistoryStore((state) => state.selectedRequestData)
    const cancellationReason = useRequestHistoryStore((state) => state.cancellationReason)
    const setCancellationReason = useRequestHistoryStore((state) => state.setCancellationReason)
    const openCancelDialog = useRequestHistoryStore((state) => state.openCancelDialog)
    const setCancelDialogOpen = useRequestHistoryStore((state) => state.setCancelDialogOpen)
    const resetCancelDialog = useRequestHistoryStore((state) => state.resetCancelDialog)

    const cancelMutation = useMutation({
        mutationFn: (data: { id: string; cancellationReason: string }) =>
            cancelApprovedRequest(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: requestKeys.all })
            resetCancelDialog()
        },
    })

    const handleCancel = () => {
        if (!cancellationReason.trim() || !selectedRequestId) return
        cancelMutation.mutate({
            id: selectedRequestId,
            cancellationReason: cancellationReason.trim(),
        })
    }

    const columns = useMemo(
        () =>
            createColumns({
                translations,
                holidays,
                locale,
                onCancel: openCancelDialog,
            }),
        [holidays, translations, locale, openCancelDialog]
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

            <CancelDialog
                open={cancelDialogOpen}
                onOpenChange={setCancelDialogOpen}
                cancellationReason={cancellationReason}
                onReasonChange={setCancellationReason}
                onConfirm={handleCancel}
                isPending={cancelMutation.isPending}
                translations={translations.cancel}
                selectedRequestData={selectedRequestData}
                locale={locale}
            />
        </>
    )
}
