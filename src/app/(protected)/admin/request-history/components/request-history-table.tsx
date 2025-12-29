"use client"

import { Fragment, useMemo, useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useSearchParams, useRouter } from "next/navigation"
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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
    const searchParams = useSearchParams()
    const router = useRouter()
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() => {
        const filters: ColumnFiltersState = []
        searchParams.forEach((value, key) => {
            if (key.startsWith("filter_")) {
                const columnId = key.replace("filter_", "")
                filters.push({ id: columnId, value })
            }
        })
        return filters
    })

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

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString())

        Array.from(params.keys()).forEach((key) => {
            if (key.startsWith("filter_")) {
                params.delete(key)
            }
        })

        columnFilters.forEach((filter) => {
            if (filter.value) {
                params.set(`filter_${filter.id}`, String(filter.value))
            }
        })

        const newSearch = params.toString()
        const currentSearch = searchParams.toString()

        if (newSearch !== currentSearch) {
            router.replace(`?${newSearch}`, { scroll: false })
        }
    }, [columnFilters, router, searchParams])

    return (
        <>
            <div className="flex flex-col gap-4 h-full min-w-0">
                <div className="rounded-md border flex-1 min-h-0">
                    <Table>
                        <TableHeader className="sticky top-0 z-30 bg-background">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <Fragment key={headerGroup.id}>
                                    <TableRow>
                                        {headerGroup.headers.map((header, index) => (
                                            <TableHead
                                                key={header.id}
                                                className={`font-semibold ${
                                                    index === 0
                                                        ? "sticky top-0 left-0 z-40 bg-background min-w-[150px] max-w-[200px] border-r"
                                                        : ""
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                              header.column.columnDef.header,
                                                              header.getContext()
                                                          )}
                                                    {header.column.getCanFilter() && (
                                                        <ColumnFilter
                                                            column={header.column}
                                                            translations={translations}
                                                        />
                                                    )}
                                                </div>
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </Fragment>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id}>
                                        {row.getVisibleCells().map((cell, index) => (
                                            <TableCell
                                                key={cell.id}
                                                className={`${
                                                    index === 0
                                                        ? "sticky left-0 z-10 bg-background min-w-[150px] max-w-[200px] border-r"
                                                        : ""
                                                }`}
                                            >
                                                {index === 0 ? (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="cursor-default truncate">
                                                                {flexRender(
                                                                    cell.column.columnDef.cell,
                                                                    cell.getContext()
                                                                )}
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <div className="text-sm">
                                                                {row.original.user.name ||
                                                                    row.original.user.email}
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ) : (
                                                    flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )
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
