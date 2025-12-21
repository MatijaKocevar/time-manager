import { create } from "zustand"

interface PendingRequestsState {
    rejectDialogOpen: boolean
    selectedRequestId: string
    rejectionReason: string
}

interface PendingRequestsActions {
    setRejectDialogOpen: (open: boolean) => void
    setSelectedRequestId: (id: string) => void
    setRejectionReason: (reason: string) => void
    openRejectDialog: (requestId: string) => void
    closeRejectDialog: () => void
    resetRejectDialog: () => void
}

export const usePendingRequestsStore = create<PendingRequestsState & PendingRequestsActions>(
    (set) => ({
        rejectDialogOpen: false,
        selectedRequestId: "",
        rejectionReason: "",
        setRejectDialogOpen: (open) => set({ rejectDialogOpen: open }),
        setSelectedRequestId: (id) => set({ selectedRequestId: id }),
        setRejectionReason: (reason) => set({ rejectionReason: reason }),
        openRejectDialog: (requestId) =>
            set({ rejectDialogOpen: true, selectedRequestId: requestId }),
        closeRejectDialog: () => set({ rejectDialogOpen: false }),
        resetRejectDialog: () =>
            set({ rejectDialogOpen: false, selectedRequestId: "", rejectionReason: "" }),
    })
)
