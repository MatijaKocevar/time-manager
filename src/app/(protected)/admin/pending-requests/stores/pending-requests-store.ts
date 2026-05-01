import { create } from "zustand"
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table"

interface PendingRequestsState {
    rejectDialogOpen: boolean
    selectedRequestId: string
    rejectionReason: string
    sorting: SortingState
    columnFilters: ColumnFiltersState
    approvingId: string | null
}

interface PendingRequestsActions {
    setRejectDialogOpen: (open: boolean) => void
    setSelectedRequestId: (id: string) => void
    setRejectionReason: (reason: string) => void
    openRejectDialog: (requestId: string) => void
    closeRejectDialog: () => void
    resetRejectDialog: () => void
    setSorting: (sorting: SortingState) => void
    setColumnFilters: (columnFilters: ColumnFiltersState) => void
    setApprovingId: (id: string | null) => void
}

export const usePendingRequestsStore = create<PendingRequestsState & PendingRequestsActions>(
    (set) => ({
        rejectDialogOpen: false,
        selectedRequestId: "",
        rejectionReason: "",
        sorting: [],
        columnFilters: [],
        approvingId: null,
        setRejectDialogOpen: (open) => set({ rejectDialogOpen: open }),
        setSelectedRequestId: (id) => set({ selectedRequestId: id }),
        setRejectionReason: (reason) => set({ rejectionReason: reason }),
        openRejectDialog: (requestId) =>
            set({ rejectDialogOpen: true, selectedRequestId: requestId }),
        closeRejectDialog: () => set({ rejectDialogOpen: false }),
        resetRejectDialog: () =>
            set({ rejectDialogOpen: false, selectedRequestId: "", rejectionReason: "" }),
        setSorting: (sorting) => set({ sorting }),
        setColumnFilters: (columnFilters) => set({ columnFilters }),
        setApprovingId: (approvingId) => set({ approvingId }),
    })
)
