import { useMutation, useQueryClient } from "@tanstack/react-query"
import { startTracking, stopTracking } from "../actions/tracker-actions"
import { useTrackerStore } from "../stores/tracker-store"
import { useTasksStore } from "@/app/(protected)/tasks/stores/tasks-store"
import { taskKeys } from "@/app/(protected)/tasks/query-keys"

export function useTrackerMutations() {
    const queryClient = useQueryClient()
    const setError = useTrackerStore((state) => state.setError)
    const clearAllActiveTimers = useTasksStore((state) => state.clearAllActiveTimers)

    const startMutation = useMutation({
        mutationFn: startTracking,
        onMutate: () => {
            setError("")
        },
        onSuccess: (data) => {
            if (data.error) {
                setError(data.error)
            } else if (data.success) {
                queryClient.invalidateQueries({ queryKey: ["tracker", "activeTimer"] })
                queryClient.invalidateQueries({ queryKey: ["tracker", "taskEntries"] })
                queryClient.invalidateQueries({ queryKey: taskKeys.activeTimer() })
            }
        },
        onError: (error) => {
            setError(error.message)
        },
    })

    const stopMutation = useMutation({
        mutationFn: stopTracking,
        onMutate: () => {
            setError("")
        },
        onSuccess: (data) => {
            if (data.error) {
                setError(data.error)
            } else {
                clearAllActiveTimers()
                queryClient.invalidateQueries({ queryKey: ["tracker", "activeTimer"] })
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
