"use client"

import { Fragment, useState } from "react"
import {
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ColumnFilter } from "./column-filter"
import { CancelDialog } from "./cancel-dialog"
import { useRequestHistoryTable } from "../_hooks/use-request-history-table"
import type { RequestDisplay, RequestHistoryTranslations } from "../types"

interface RequestHistoryTableClientProps {
    requests: RequestDisplay[]
    holidays: Array<{ date: Date; name: string }>
    translations: RequestHistoryTranslations
    locale: string
}

export function RequestHistoryTableClient({
    requests,
    holidays,
    translations,
    locale,
}: RequestHistoryTableClientProps) {
    const [pageSize, setPageSize] = useState(20)

    const {
        columns,
        sorting,
        columnFilters,
        onSortingChange,
        onColumnFiltersChange,
        cancelDialogOpen,
        cancellationReason,
        isCancelPending,
        setCancelDialogOpen,
        setCancellationReason,
        handleCancel,
        selectedRequestData,
    } = useRequestHistoryTable({ requests, holidays, translations, locale })

    const table = useReactTable({
        data: requests,
        columns,
        onSortingChange,
        onColumnFiltersChange,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        state: {
            sorting,
            columnFilters,
            pagination: { pageIndex: 0, pageSize },
        },
        autoResetPageIndex: true,
    })

    return (
        <>
            <div className="flex flex-col gap-4 h-full min-w-0">
                <div id="history-table" className="rounded-md border flex-1 min-h-0">
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
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{translations.pagination.rowsPerPage}</span>
                        <Select
                            value={String(pageSize)}
                            onValueChange={(v) => {
                                setPageSize(Number(v))
                                table.setPageIndex(0)
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
                        <span>
                            {translations.pagination.pageOf
                                .replace(
                                    "{page}",
                                    String(table.getState().pagination.pageIndex + 1)
                                )
                                .replace("{total}", String(table.getPageCount()))}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <CancelDialog
                open={cancelDialogOpen}
                onOpenChange={setCancelDialogOpen}
                cancellationReason={cancellationReason}
                onReasonChange={setCancellationReason}
                onConfirm={handleCancel}
                isPending={isCancelPending}
                translations={translations.cancel}
                selectedRequestData={selectedRequestData}
                locale={locale}
            />
        </>
    )
}
