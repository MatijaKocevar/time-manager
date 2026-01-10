import { deleteList } from "../actions/list-actions"
import { listKeys } from "../query-keys"
import type { QueryClient } from "@tanstack/react-query"

export async function handleDeleteList(
    listId: string,
    queryClient: QueryClient,
    currentPathname: string,
    confirmMessage: string,
    setDeletingListId: (id: string | null) => void
): Promise<{ success: boolean; error?: string }> {
    if (!confirm(confirmMessage)) {
        return { success: false }
    }

    setDeletingListId(listId)
    try {
        const result = await deleteList({ id: listId })
        if (result.success) {
            await queryClient.invalidateQueries({ queryKey: listKeys.all })
            if (currentPathname.includes(listId)) {
                window.location.href = "/tasks"
            }
        }
        return result
    } catch (error) {
        console.error("Failed to delete list:", error)
        return { success: false, error: "Failed to delete list" }
    } finally {
        setDeletingListId(null)
    }
}
