"use client"

import { useEffect } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useTasksStore } from "../_stores/tasks-store"
import { useTaskDialogStore } from "../_stores/task-dialog-stores"
import { createTask } from "../_actions/task-actions"
import { taskKeys } from "../_constants/query-keys"
import { TASK_STATUSES } from "../_constants/task-statuses"
import { getTaskStatusLabel } from "../_utils/task-status-labels"

export function CreateTaskDialog() {
    const queryClient = useQueryClient()
    const t = useTranslations("tasks.form")
    const tCommon = useTranslations("common")
    const tStatus = useTranslations("tasks.statuses")
    const createDialog = useTaskDialogStore((state) => state.createDialog)
    const selectedListId = useTasksStore((state) => state.selectedListId)
    const createForm = useTaskDialogStore((state) => state.createForm)
    const closeCreateDialog = useTaskDialogStore((state) => state.closeCreateDialog)
    const setCreateFormData = useTaskDialogStore((state) => state.setCreateFormData)
    const setCreateFormLoading = useTaskDialogStore((state) => state.setCreateLoading)
    const setCreateFormError = useTaskDialogStore((state) => state.setCreateError)
    const resetCreateForm = useTaskDialogStore((state) => state.resetCreateForm)

    useEffect(() => {
        if (!createDialog.isOpen) {
            resetCreateForm()
        }
    }, [createDialog.isOpen, resetCreateForm])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!createForm.data.title.trim()) {
            setCreateFormError(t("titleRequired"))
            return
        }

        setCreateFormLoading(true)
        setCreateFormError("")

        try {
            const result = await createTask({
                title: createForm.data.title,
                description: createForm.data.description || undefined,
                status: createForm.data.status,
                parentId: createDialog.parentId || undefined,
                listId: createDialog.parentId ? undefined : (createDialog.listId ?? selectedListId),
            })

            if (result.success) {
                await queryClient.invalidateQueries({ queryKey: taskKeys.all })
                closeCreateDialog()
            } else {
                setCreateFormError(result.error ?? "Failed to create task")
            }
        } catch (error) {
            setCreateFormError(error instanceof Error ? error.message : "Failed to create task")
        } finally {
            setCreateFormLoading(false)
        }
    }

    return (
        <Dialog open={createDialog.isOpen} onOpenChange={closeCreateDialog}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {createDialog.parentId ? t("createSubtask") : t("createTask")}
                        </DialogTitle>
                        <DialogDescription>
                            {createDialog.parentId
                                ? t("addSubtaskDescription")
                                : t("createTaskDescription")}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">{tCommon("fields.title")} *</Label>
                            <Input
                                id="title"
                                value={createForm.data.title}
                                onChange={(e) => setCreateFormData({ title: e.target.value })}
                                placeholder={t("enterTaskTitle")}
                                disabled={createForm.isLoading}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">{tCommon("fields.description")}</Label>
                            <Input
                                id="description"
                                value={createForm.data.description}
                                onChange={(e) => setCreateFormData({ description: e.target.value })}
                                placeholder={t("enterTaskDescription")}
                                disabled={createForm.isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">{tCommon("fields.status")}</Label>
                            <Select
                                value={createForm.data.status}
                                onValueChange={(value) =>
                                    setCreateFormData({
                                        status: value as typeof createForm.data.status,
                                    })
                                }
                                disabled={createForm.isLoading}
                            >
                                <SelectTrigger id="status" className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TASK_STATUSES.map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                            <div
                                                className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${status.color}`}
                                            >
                                                {getTaskStatusLabel(tStatus, status.value)}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {createForm.error && (
                            <div className="text-sm text-destructive">{createForm.error}</div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeCreateDialog}
                            disabled={createForm.isLoading}
                        >
                            {tCommon("actions.cancel")}
                        </Button>
                        <Button type="submit" disabled={createForm.isLoading}>
                            {createForm.isLoading ? t("creating") : tCommon("actions.create")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
