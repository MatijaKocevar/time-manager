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
import { Trash2 } from "lucide-react"
import { deleteUser } from "../actions/user-actions"
import { useUserDialogStore } from "../stores/user-dialog-store"

interface DeleteUserDialogProps {
    userId: string
    userName: string | null
    userEmail: string
}

export function DeleteUserDialog({ userId, userName, userEmail }: DeleteUserDialogProps) {
    const router = useRouter()
    const isOpen = useUserDialogStore((state) => state.deleteDialog.isOpen)
    const data = useUserDialogStore((state) => state.deleteDialog.data)
    const isLoading = useUserDialogStore((state) => state.deleteDialog.isLoading)
    const error = useUserDialogStore((state) => state.deleteDialog.error)
    const openDeleteDialog = useUserDialogStore((state) => state.openDeleteDialog)
    const closeDeleteDialog = useUserDialogStore((state) => state.closeDeleteDialog)
    const setDeleteLoading = useUserDialogStore((state) => state.setDeleteLoading)
    const setDeleteError = useUserDialogStore((state) => state.setDeleteError)

    const handleDelete = async () => {
        if (!data) return

        setDeleteLoading(true)

        const result = await deleteUser({ id: data.id })

        if (result.error) {
            setDeleteError(result.error)
        } else {
            closeDeleteDialog()
            router.refresh()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={closeDeleteDialog}>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => openDeleteDialog({ id: userId, name: userName })}
            >
                <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete User</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this user? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
                    )}
                    <div className="rounded-md bg-muted p-4">
                        <p className="text-sm font-medium">{data?.name}</p>
                        <p className="text-sm text-muted-foreground">{userEmail}</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={closeDeleteDialog}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isLoading}
                    >
                        {isLoading ? "Deleting..." : "Delete User"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
