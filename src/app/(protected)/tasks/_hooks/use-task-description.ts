"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useTasksStore } from "../_stores/tasks-store"
import { getTaskDescription } from "../_actions/description-actions"
import { updateTask } from "../_actions/task-actions"
import { taskKeys } from "../query-keys"

export function useTaskDescription() {
    const queryClient = useQueryClient()
    const taskId = useTasksStore((s) => s.descriptionDialog.taskId)
    const isLoading = useTasksStore((s) => s.descriptionForm.isLoading)
    const setDescriptionLoading = useTasksStore((s) => s.setDescriptionLoading)
    const closeDescriptionDialog = useTasksStore((s) => s.closeDescriptionDialog)

    const { data, isLoading: isFetching } = useQuery({
        queryKey: taskKeys.description(taskId ?? ""),
        queryFn: () => getTaskDescription(taskId!),
        enabled: !!taskId,
        staleTime: 30000,
    })

    async function handleSave(html: string) {
        if (!taskId) return

        setDescriptionLoading(true)

        const result = await updateTask({ id: taskId, description: html })

        setDescriptionLoading(false)

        if (result.success) {
            queryClient.setQueryData(taskKeys.description(taskId), { description: html })
            await queryClient.invalidateQueries({ queryKey: taskKeys.all })
            closeDescriptionDialog()
        } else {
            toast.error(result.error ?? "Failed to save description")
        }
    }

    async function handleImageUpload(file: File, taskId: string): Promise<string> {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch(`/api/uploads/tasks/${taskId}`, {
            method: "POST",
            body: formData,
        })

        if (!response.ok) {
            const body = (await response.json()) as { error?: string }
            throw new Error(body.error ?? "Upload failed")
        }

        const body = (await response.json()) as { url: string }
        return body.url
    }

    return {
        description: data?.description ?? null,
        isFetching,
        isLoading,
        handleSave,
        handleImageUpload,
    }
}
