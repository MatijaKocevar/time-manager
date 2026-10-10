import { useQuery } from "@tanstack/react-query"
import { getTaskTimeEntryCount } from "../_actions/tracker-actions"
import { trackerKeys } from "../_constants/query-keys"

export function useTaskEntryCount(taskId: string | null, initialCount: number) {
    const { data: count = 0 } = useQuery({
        queryKey: trackerKeys.taskEntryCount(taskId ?? ""),
        queryFn: () => getTaskTimeEntryCount(taskId ?? undefined),
        initialData: initialCount,
        enabled: Boolean(taskId),
        refetchOnWindowFocus: false,
        staleTime: 0,
    })

    return { count }
}
