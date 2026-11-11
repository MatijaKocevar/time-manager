"use client"

import { useQuery } from "@tanstack/react-query"
import { getListOverview } from "../_actions/list-overview-actions"
import { taskKeys } from "../_constants/query-keys"

export function useListOverview(listId: string | null, enabled: boolean) {
    return useQuery({
        queryKey: taskKeys.listOverview(listId ?? "none"),
        queryFn: () => getListOverview({ listId: listId ?? "" }),
        enabled: enabled && Boolean(listId),
        staleTime: 30000,
    })
}
