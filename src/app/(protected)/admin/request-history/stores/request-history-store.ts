import { create } from "zustand"

interface RequestHistoryState {
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
        cancelDialogOpen: false,
        selectedRequestId: "",
        selectedRequestData: null,
        cancellationReason: "",
        setCancelDialogOpen: (open) => set({ cancelDialogOpen: open }),
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
