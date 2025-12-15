"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTasksStore } from "../stores/tasks-store"
import { deleteTask } from "../actions/task-actions"
import { taskKeys } from "../query-keys"

export function DeleteTaskDialog() {
    const queryClient = useQueryClient()
    const t = useTranslations("tasks.form")
    const tCommon = useTranslations("common")
    const deleteDialog = useTasksStore((state) => state.deleteDialog)
    const closeDeleteDialog = useTasksStore((state) => state.closeDeleteDialog)
    const isLoading = useTasksStore((state) => state.deleteTaskForm.isLoading)
    const error = useTasksStore((state) => state.deleteTaskForm.error)
    const setDeleteTaskLoading = useTasksStore((state) => state.setDeleteTaskLoading)
    const setDeleteTaskError = useTasksStore((state) => state.setDeleteTaskError)
    const clearDeleteTaskError = useTasksStore((state) => state.clearDeleteTaskError)

    const handleDelete = async () => {
        if (!deleteDialog.taskId) return

        setDeleteTaskLoading(true)
        clearDeleteTaskError()

        try {
            const result = await deleteTask({ id: deleteDialog.taskId })

            if (result.success) {
                await queryClient.invalidateQueries({ queryKey: taskKeys.all })
                closeDeleteDialog()
            } else {
                setDeleteTaskError(result.error ?? "Failed to delete task")
            }
        } catch (err) {
            setDeleteTaskError(err instanceof Error ? err.message : "Failed to delete task")
        } finally {
            setDeleteTaskLoading(false)
        }
    }

    return (
        <Dialog open={deleteDialog.isOpen} onOpenChange={closeDeleteDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("deleteTask")}</DialogTitle>
                    <DialogDescription>{t("deleteTaskConfirm")}</DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                        {tCommon("messages.deleteConfirm", { item: "" })}
                    </p>

                    {error && <div className="mt-4 text-sm text-destructive">{error}</div>}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={closeDeleteDialog}
                        disabled={isLoading}
                    >
                        {tCommon("actions.cancel")}
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isLoading}
                    >
                        {isLoading ? t("deleting") : tCommon("actions.delete")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
