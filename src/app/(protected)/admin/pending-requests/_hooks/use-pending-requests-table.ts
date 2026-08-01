"use client"

import { useMemo, useEffect, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useSearchParams, useRouter } from "next/navigation"
import type { OnChangeFn, SortingState, ColumnFiltersState } from "@tanstack/react-table"
import { approveRequest, rejectRequest } from "../../../requests/_actions/request-actions"
import { requestKeys } from "../../../requests/query-keys"
import { hourKeys } from "../../../hours/query-keys"
import { toast } from "sonner"
import { createColumns } from "../_utils/columns"
import { usePendingRequestsStore } from "../_stores/pending-requests-store"
import type { RequestDisplay, PendingRequestTranslations } from "../types"

interface UsePendingRequestsTableParams {
    requests: RequestDisplay[]
    holidays: Array<{ date: Date; name: string }>
    locale: string
    translations: PendingRequestTranslations
}

export function usePendingRequestsTable({
    requests,
    holidays,
    locale,
    translations,
}: UsePendingRequestsTableParams) {
    const queryClient = useQueryClient()
    const searchParams = useSearchParams()
    const router = useRouter()

    const sorting = usePendingRequestsStore((s) => s.sorting)
    const columnFilters = usePendingRequestsStore((s) => s.columnFilters)
    const approvingId = usePendingRequestsStore((s) => s.approvingId)
    const rejectDialogOpen = usePendingRequestsStore((s) => s.rejectDialogOpen)
    const selectedRequestId = usePendingRequestsStore((s) => s.selectedRequestId)
    const rejectionReason = usePendingRequestsStore((s) => s.rejectionReason)
    const setSorting = usePendingRequestsStore((s) => s.setSorting)
    const setColumnFilters = usePendingRequestsStore((s) => s.setColumnFilters)
    const setApprovingId = usePendingRequestsStore((s) => s.setApprovingId)
    const setRejectionReason = usePendingRequestsStore((s) => s.setRejectionReason)
    const setRejectDialogOpen = usePendingRequestsStore((s) => s.setRejectDialogOpen)
    const openRejectDialog = usePendingRequestsStore((s) => s.openRejectDialog)
    const resetRejectDialog = usePendingRequestsStore((s) => s.resetRejectDialog)

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
        onSuccess: (data, _variables, context) => {
            if ("error" in data) {
                toast.error(translations.table.approveError)
                if (context?.previousRequests) {
                    queryClient.setQueryData(requestKeys.all, context.previousRequests)
                }
                queryClient.invalidateQueries({ queryKey: requestKeys.all })
            } else {
                toast.success(translations.table.approveSuccess)
                queryClient.invalidateQueries({ queryKey: hourKeys.all })
            }
        },
        onError: (_error, _variables, context) => {
            toast.error(translations.table.approveError)
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
            toast.success(translations.table.rejectSuccess)
            queryClient.invalidateQueries({ queryKey: requestKeys.all })
            resetRejectDialog()
        },
        onError: () => {
            toast.error(translations.table.approveError)
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
                requests,
            }),
        [
            approveMutation,
            rejectMutation.isPending,
            approvingId,
            holidays,
            translations,
            locale,
            openRejectDialog,
            requests,
        ]
    )

    const onSortingChange: OnChangeFn<SortingState> = (updater) =>
        setSorting(typeof updater === "function" ? updater(sorting) : updater)

    const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) =>
        setColumnFilters(typeof updater === "function" ? updater(columnFilters) : updater)

    function handleReject() {
        if (!rejectionReason || !selectedRequestId) return
        rejectMutation.mutate({ id: selectedRequestId, rejectionReason })
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

    return {
        columns,
        sorting,
        columnFilters,
        onSortingChange,
        onColumnFiltersChange,
        rejectDialogOpen,
        rejectionReason,
        isRejectPending: rejectMutation.isPending,
        setRejectDialogOpen,
        setRejectionReason,
        handleReject,
    }
}
