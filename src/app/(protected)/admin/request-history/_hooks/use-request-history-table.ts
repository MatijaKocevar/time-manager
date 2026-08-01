"use client"

import { useMemo, useEffect, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useSearchParams, useRouter } from "next/navigation"
import type { OnChangeFn, SortingState, ColumnFiltersState } from "@tanstack/react-table"
import { toast } from "sonner"
import { cancelApprovedRequest } from "../../../requests/_actions/request-actions"
import { requestKeys } from "../../../requests/query-keys"
import { hourKeys } from "../../../hours/query-keys"
import { createColumns } from "../_utils/columns"
import { useRequestHistoryStore } from "../_stores/request-history-store"
import type { RequestDisplay, RequestHistoryTranslations } from "../types"

interface UseRequestHistoryTableParams {
    requests: RequestDisplay[]
    holidays: Array<{ date: Date; name: string }>
    locale: string
    translations: RequestHistoryTranslations
}

export function useRequestHistoryTable({
    requests,
    holidays,
    locale,
    translations,
}: UseRequestHistoryTableParams) {
    const queryClient = useQueryClient()
    const searchParams = useSearchParams()
    const router = useRouter()

    const sorting = useRequestHistoryStore((s) => s.sorting)
    const columnFilters = useRequestHistoryStore((s) => s.columnFilters)
    const cancelDialogOpen = useRequestHistoryStore((s) => s.cancelDialogOpen)
    const selectedRequestId = useRequestHistoryStore((s) => s.selectedRequestId)
    const selectedRequestData = useRequestHistoryStore((s) => s.selectedRequestData)
    const cancellationReason = useRequestHistoryStore((s) => s.cancellationReason)
    const setSorting = useRequestHistoryStore((s) => s.setSorting)
    const setColumnFilters = useRequestHistoryStore((s) => s.setColumnFilters)
    const setCancellationReason = useRequestHistoryStore((s) => s.setCancellationReason)
    const setCancelDialogOpen = useRequestHistoryStore((s) => s.setCancelDialogOpen)
    const openCancelDialog = useRequestHistoryStore((s) => s.openCancelDialog)
    const resetCancelDialog = useRequestHistoryStore((s) => s.resetCancelDialog)

    const initialized = useRef(false)
    useEffect(() => {
        if (initialized.current) return
        initialized.current = true
        const filters: ColumnFiltersState = []
        searchParams.forEach((value, key) => {
            if (key.startsWith("filter_")) {
                filters.push({ id: key.replace("filter_", ""), value })
            }
        })
        if (filters.length > 0) {
            setColumnFilters(filters)
        }
    }, [searchParams, setColumnFilters])

    const cancelMutation = useMutation({
        mutationFn: (data: { id: string; cancellationReason: string }) =>
            cancelApprovedRequest(data),
        onSuccess: () => {
            toast.success(translations.table.cancelSuccess)
            queryClient.invalidateQueries({ queryKey: requestKeys.all })
            queryClient.invalidateQueries({ queryKey: hourKeys.all })
            resetCancelDialog()
        },
        onError: () => {
            toast.error(translations.table.cancelError)
        },
    })

    function handleCancel() {
        if (!cancellationReason.trim() || !selectedRequestId) return
        cancelMutation.mutate({
            id: selectedRequestId,
            cancellationReason: cancellationReason.trim(),
        })
    }

    const onSortingChange: OnChangeFn<SortingState> = (updater) => {
        setSorting(typeof updater === "function" ? updater(sorting) : updater)
    }

    const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
        setColumnFilters(typeof updater === "function" ? updater(columnFilters) : updater)
    }

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

    return {
        columns,
        sorting,
        columnFilters,
        onSortingChange,
        onColumnFiltersChange,
        cancelDialogOpen,
        cancellationReason,
        isCancelPending: cancelMutation.isPending,
        setCancelDialogOpen,
        setCancellationReason,
        handleCancel,
        selectedRequestData,
    }
}
