"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useHoursStore } from "../stores/hours-store"
import { updateHourEntry } from "../actions/hour-actions"
import { HOUR_TYPES } from "../constants/hour-types"
import { hourKeys } from "../query-keys"

interface EditHourDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditHourDialog({ open, onOpenChange }: EditHourDialogProps) {
    const queryClient = useQueryClient()
    const editFormData = useHoursStore((state) => state.editForm.data)
    const isEditLoading = useHoursStore((state) => state.editForm.isLoading)
    const editError = useHoursStore((state) => state.editForm.error)
    const setEditFormData = useHoursStore((state) => state.setEditFormData)
    const resetEditForm = useHoursStore((state) => state.resetEditForm)
    const setEditLoading = useHoursStore((state) => state.setEditLoading)
    const setEditError = useHoursStore((state) => state.setEditError)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editFormData) return

        setEditLoading(true)
        setEditError("")

        const result = await updateHourEntry({
            id: editFormData.id,
            date: editFormData.date,
            hours: editFormData.hours,
            type: editFormData.type,
            description: editFormData.description || undefined,
        })

        if (result.error) {
            setEditError(result.error)
            setEditLoading(false)
        } else {
            onOpenChange(false)
            resetEditForm()
            setEditLoading(false)
            queryClient.invalidateQueries({ queryKey: hourKeys.all })
        }
    }

    const handleClose = () => {
        onOpenChange(false)
        resetEditForm()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Hour Entry</DialogTitle>
                </DialogHeader>
                {editFormData && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {editError && (
                            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                                {editError}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="edit-date">Date</Label>
                            <Input
                                id="edit-date"
                                type="date"
                                value={editFormData.date}
                                onChange={(e) => setEditFormData({ date: e.target.value })}
                                required
                                disabled={isEditLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-hours">Hours</Label>
                            <Input
                                id="edit-hours"
                                type="number"
                                step="0.5"
                                min="0.5"
                                max="24"
                                value={editFormData.hours}
                                onChange={(e) =>
                                    setEditFormData({ hours: parseFloat(e.target.value) })
                                }
                                required
                                disabled={isEditLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-type">Type</Label>
                            <Select
                                value={editFormData.type}
                                onValueChange={(value: string) =>
                                    setEditFormData({
                                        type: value as
                                            | "WORK"
                                            | "VACATION"
                                            | "SICK_LEAVE"
                                            | "WORK_FROM_HOME"
                                            | "OTHER",
                                    })
                                }
                                disabled={isEditLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {HOUR_TYPES.map((hourType) => (
                                        <SelectItem key={hourType.value} value={hourType.value}>
                                            {hourType.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description (Optional)</Label>
                            <Input
                                id="edit-description"
                                value={editFormData.description}
                                onChange={(e) => setEditFormData({ description: e.target.value })}
                                placeholder="Add notes about this entry..."
                                disabled={isEditLoading}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isEditLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isEditLoading}>
                                {isEditLoading ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
