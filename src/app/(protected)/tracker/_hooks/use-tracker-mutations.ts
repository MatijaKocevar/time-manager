import { useMutation, useQueryClient } from "@tanstack/react-query"
import { startTimer, stopTimer } from "@/app/(protected)/shared/_actions/timer-actions"
import { useTrackerStore } from "../_stores/tracker-store"
import { useTasksStore } from "@/app/(protected)/tasks/_stores/tasks-store"
import { taskKeys } from "@/app/(protected)/tasks/_constants/query-keys"
import { sharedKeys } from "@/app/(protected)/shared/_constants/query-keys"

export function useTrackerMutations(
    onArrivalNeeded?: (hasApprovedWFH: boolean, wfhLocation: string | null) => void
) {
    const queryClient = useQueryClient()
    const setError = useTrackerStore((state) => state.setError)
    const clearActiveTimer = useTasksStore((state) => state.clearActiveTimer)

    const startMutation = useMutation({
        mutationFn: startTimer,
        onMutate: () => {
            setError("")
            clearActiveTimer()
        },
        onSuccess: (data) => {
            if (data.error) {
                setError(data.error)
            } else if (data.success) {
                if (data.shouldShowArrivalDialog && onArrivalNeeded) {
                    onArrivalNeeded(data.hasApprovedWFH ?? false, data.wfhLocation ?? null)
                }
                queryClient.invalidateQueries({ queryKey: sharedKeys.activeTimer() })
                queryClient.invalidateQueries({ queryKey: ["tracker", "dailySummary"] })
                queryClient.invalidateQueries({ queryKey: ["tracker", "taskEntries"] })
                queryClient.invalidateQueries({ queryKey: taskKeys.activeTimer() })
            }
        },
        onError: (error) => {
            setError(error.message)
        },
    })

    const stopMutation = useMutation({
        mutationFn: stopTimer,
        onMutate: () => {
            setError("")
        },
        onSuccess: (data) => {
            if (data.error) {
                setError(data.error)
            } else {
                clearActiveTimer()
                queryClient.invalidateQueries({ queryKey: sharedKeys.activeTimer() })
                queryClient.invalidateQueries({ queryKey: ["tracker", "dailySummary"] })
                queryClient.invalidateQueries({ queryKey: ["tracker", "taskEntries"] })
                queryClient.invalidateQueries({ queryKey: taskKeys.activeTimer() })
            }
        },
        onError: (error) => {
            setError(error.message)
        },
    })

    return {
        startMutation,
        stopMutation,
        isLoading: startMutation.isPending || stopMutation.isPending,
    }
}
