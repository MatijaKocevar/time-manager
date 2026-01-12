import { useQuery } from "@tanstack/react-query"
import { getTaskTimeEntries } from "../actions/tracker-actions"
import type { HourType } from "@/../../prisma/generated/client"

export function useTaskTimeEntries(
    taskId: string | null,
    initialTaskEntries: Array<{
        id: string
        userId: string
        taskId: string
        startTime: Date
        endTime: Date | null
        duration: number | null
        createdAt: Date
        updatedAt: Date
        type: HourType
    }>
) {
    const { data: taskEntries = [] } = useQuery({
        queryKey: ["tracker", "taskEntries", taskId],
        queryFn: () => getTaskTimeEntries(taskId ?? undefined),
        initialData: initialTaskEntries,
        enabled: Boolean(taskId),
        refetchOnWindowFocus: false,
        staleTime: 0,
    })

    return { taskEntries }
}
