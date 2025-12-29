"use client"

import { useState } from "react"
import { Column } from "@tanstack/react-table"
import { Search, X } from "lucide-react"
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
import type { RequestDisplay, RequestHistoryTranslations } from "../types"

interface ColumnFilterProps {
    column: Column<RequestDisplay, unknown>
    translations: RequestHistoryTranslations
}

export function ColumnFilter({ column, translations }: ColumnFilterProps) {
    const columnFilterValue = column.getFilterValue()
    const uniqueValues = column.getFacetedUniqueValues()
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

    return (
        <>
            <div className="inline-flex items-center gap-1">
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
                {hasActiveFilter && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            handleClearFilter()
                        }}
                        className="inline-flex items-center justify-center hover:bg-accent rounded-sm p-0.5"
                        aria-label="Clear filter"
                    >
                        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                )}
            </div>
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
