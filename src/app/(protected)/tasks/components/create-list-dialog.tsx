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
import { Textarea } from "@/components/ui/textarea"
import { useTasksStore } from "../stores/tasks-store"
import { createList, updateList } from "../actions/list-actions"
import { listKeys } from "../query-keys"

export function CreateListDialog() {
    const queryClient = useQueryClient()
    const t = useTranslations("tasks.form")
    const tCommon = useTranslations("common")
    const listDialog = useTasksStore((state) => state.listDialog)
    const listForm = useTasksStore((state) => state.listForm)
    const closeListDialog = useTasksStore((state) => state.closeListDialog)
    const setListFormData = useTasksStore((state) => state.setListFormData)
    const setListLoading = useTasksStore((state) => state.setListLoading)
    const setListError = useTasksStore((state) => state.setListError)
    const resetListForm = useTasksStore((state) => state.resetListForm)

    const isEditing = Boolean(listDialog.listId)

    useEffect(() => {
        if (!listDialog.isOpen) {
            resetListForm()
        }
    }, [listDialog.isOpen, resetListForm])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!listForm.data.name.trim()) {
            setListError(t("nameRequired"))
            return
        }

        setListLoading(true)
        setListError("")

        try {
            const result =
                isEditing && listDialog.listId
                    ? await updateList({
                          id: listDialog.listId,
                          name: listForm.data.name,
                          description: listForm.data.description || undefined,
                          color: listForm.data.color || undefined,
                      })
                    : await createList({
                          name: listForm.data.name,
                          description: listForm.data.description || undefined,
                          color: listForm.data.color || undefined,
                      })

            if (result.success) {
                await queryClient.invalidateQueries({ queryKey: listKeys.all })
                closeListDialog()
            } else {
                setListError(result.error ?? "Failed to save list")
            }
        } catch (error) {
            setListError(error instanceof Error ? error.message : "Failed to save list")
        } finally {
            setListLoading(false)
        }
    }

    return (
        <Dialog open={listDialog.isOpen} onOpenChange={closeListDialog}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? t("editList") : t("createNewList")}</DialogTitle>
                        <DialogDescription>
                            {isEditing ? t("updateListDetails") : t("createListDescription")}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="list-name">{tCommon("fields.name")}</Label>
                            <Input
                                id="list-name"
                                placeholder={t("enterListName")}
                                value={listForm.data.name}
                                onChange={(e) => setListFormData({ name: e.target.value })}
                                disabled={listForm.isLoading}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="list-description">{t("descriptionOptional")}</Label>
                            <Textarea
                                id="list-description"
                                placeholder={t("enterListDescription")}
                                value={listForm.data.description}
                                onChange={(e) => setListFormData({ description: e.target.value })}
                                disabled={listForm.isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="list-color">{t("colorOptional")}</Label>
                            <Input
                                id="list-color"
                                type="color"
                                value={listForm.data.color || "#3b82f6"}
                                onChange={(e) => setListFormData({ color: e.target.value })}
                                disabled={listForm.isLoading}
                            />
                        </div>

                        {listForm.error && (
                            <div className="text-sm text-red-600">{listForm.error}</div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeListDialog}
                            disabled={listForm.isLoading}
                        >
                            {tCommon("actions.cancel")}
                        </Button>
                        <Button type="submit" disabled={listForm.isLoading}>
                            {listForm.isLoading
                                ? t(isEditing ? "updating" : "creating")
                                : tCommon(isEditing ? "actions.update" : "actions.create")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
