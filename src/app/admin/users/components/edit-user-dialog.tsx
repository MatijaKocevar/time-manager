"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil } from "lucide-react"
import { updateUser } from "../actions/user-actions"
import { useUserDialogStore } from "../stores/user-dialog-store"
import type { UserRole } from "@/types"

interface EditUserDialogProps {
    user: {
        id: string
        name: string | null
        role: UserRole
    }
}

export function EditUserDialog({ user }: EditUserDialogProps) {
    const router = useRouter()
    const isOpen = useUserDialogStore((state) => state.editDialog.isOpen)
    const data = useUserDialogStore((state) => state.editDialog.data)
    const isLoading = useUserDialogStore((state) => state.editDialog.isLoading)
    const error = useUserDialogStore((state) => state.editDialog.error)
    const openEditDialog = useUserDialogStore((state) => state.openEditDialog)
    const closeEditDialog = useUserDialogStore((state) => state.closeEditDialog)
    const setEditDialogData = useUserDialogStore((state) => state.setEditDialogData)
    const setEditLoading = useUserDialogStore((state) => state.setEditLoading)
    const setEditError = useUserDialogStore((state) => state.setEditError)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!data) return

        setEditLoading(true)

        const result = await updateUser(data)

        if (result.error) {
            setEditError(result.error)
        } else {
            closeEditDialog()
            router.refresh()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={closeEditDialog}>
            <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                <Pencil className="h-4 w-4" />
            </Button>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Update user information. Email cannot be changed.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                value={data?.name || ""}
                                onChange={(e) => setEditDialogData({ name: e.target.value })}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-role">Role</Label>
                            <select
                                id="edit-role"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={data?.role || "USER"}
                                onChange={(e) =>
                                    setEditDialogData({ role: e.target.value as UserRole })
                                }
                                disabled={isLoading}
                            >
                                <option value="USER">User</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={closeEditDialog}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
