"use client"

import { useQueryClient } from "@tanstack/react-query"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useTasksStore } from "../stores/tasks-store"
import { moveTaskToList } from "../actions/list-actions"
import { taskKeys, listKeys } from "../query-keys"
import type { ListDisplay } from "../schemas/list-schemas"

interface MoveTaskDialogProps {
    lists: ListDisplay[]
}

export function MoveTaskDialog({ lists }: MoveTaskDialogProps) {
    const queryClient = useQueryClient()
    const moveTaskDialog = useTasksStore((state) => state.moveTaskDialog)
    const closeMoveTaskDialog = useTasksStore((state) => state.closeMoveTaskDialog)
    const selectedListId = useTasksStore((state) => state.moveTaskForm.selectedListId)
    const isLoading = useTasksStore((state) => state.moveTaskForm.isLoading)
    const error = useTasksStore((state) => state.moveTaskForm.error)
    const setMoveTaskSelectedListId = useTasksStore((state) => state.setMoveTaskSelectedListId)
    const setMoveTaskLoading = useTasksStore((state) => state.setMoveTaskLoading)
    const setMoveTaskError = useTasksStore((state) => state.setMoveTaskError)
    const clearMoveTaskError = useTasksStore((state) => state.clearMoveTaskError)
    const resetMoveTaskForm = useTasksStore((state) => state.resetMoveTaskForm)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!moveTaskDialog.taskId) return

        setMoveTaskLoading(true)
        clearMoveTaskError()

        try {
            const result = await moveTaskToList({
                taskId: moveTaskDialog.taskId,
                listId: selectedListId || null,
            })

            if (result.success) {
                await queryClient.invalidateQueries({ queryKey: taskKeys.all })
                await queryClient.invalidateQueries({ queryKey: listKeys.all })
                resetMoveTaskForm()
                closeMoveTaskDialog()
            } else {
                setMoveTaskError(result.error ?? "Failed to move task")
            }
        } catch (err) {
            setMoveTaskError(err instanceof Error ? err.message : "Failed to move task")
        } finally {
            setMoveTaskLoading(false)
        }
    }

    return (
        <Dialog open={moveTaskDialog.isOpen} onOpenChange={closeMoveTaskDialog}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Move Task to List</DialogTitle>
                        <DialogDescription>
                            Select a list to move this task to, or select no list to remove it from
                            all lists.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="list-select">Destination List</Label>
                            <Select
                                value={selectedListId}
                                onValueChange={setMoveTaskSelectedListId}
                            >
                                <SelectTrigger id="list-select">
                                    <SelectValue placeholder="Select a list" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">No List</SelectItem>
                                    {lists.map((list) => (
                                        <SelectItem key={list.id} value={list.id}>
                                            {list.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {error && <div className="text-sm text-red-600">{error}</div>}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeMoveTaskDialog}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Moving..." : "Move Task"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
