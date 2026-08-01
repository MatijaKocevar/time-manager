import { create } from "zustand"
import type { SortingState, ColumnFiltersState } from "@tanstack/react-table"

interface RequestHistoryState {
    sorting: SortingState
    columnFilters: ColumnFiltersState
    cancelDialogOpen: boolean
    selectedRequestId: string
    selectedRequestData: {
        userName: string
        type: string
        startDate: Date
        endDate: Date
    } | null
    cancellationReason: string
}

interface RequestHistoryActions {
    setSorting: (sorting: SortingState) => void
    setColumnFilters: (filters: ColumnFiltersState) => void
    setCancelDialogOpen: (open: boolean) => void
    setSelectedRequestId: (id: string) => void
    setSelectedRequestData: (
        data: {
            userName: string
            type: string
            startDate: Date
            endDate: Date
        } | null
    ) => void
    setCancellationReason: (reason: string) => void
    openCancelDialog: (
        requestId: string,
        userName: string,
        type: string,
        startDate: Date,
        endDate: Date
    ) => void
    closeCancelDialog: () => void
    resetCancelDialog: () => void
}

export const useRequestHistoryStore = create<RequestHistoryState & RequestHistoryActions>(
    (set) => ({
        sorting: [],
        columnFilters: [],
        cancelDialogOpen: false,
        selectedRequestId: "",
        selectedRequestData: null,
        cancellationReason: "",
        setCancelDialogOpen: (open) => set({ cancelDialogOpen: open }),
        setSorting: (sorting) => set({ sorting }),
        setColumnFilters: (filters) => set({ columnFilters: filters }),
        setSelectedRequestId: (id) => set({ selectedRequestId: id }),
        setSelectedRequestData: (data) => set({ selectedRequestData: data }),
        setCancellationReason: (reason) => set({ cancellationReason: reason }),
        openCancelDialog: (requestId, userName, type, startDate, endDate) =>
            set({
                cancelDialogOpen: true,
                selectedRequestId: requestId,
                selectedRequestData: { userName, type, startDate, endDate },
            }),
        closeCancelDialog: () => set({ cancelDialogOpen: false }),
        resetCancelDialog: () =>
            set({
                cancelDialogOpen: false,
                selectedRequestId: "",
                selectedRequestData: null,
                cancellationReason: "",
            }),
    })
)
