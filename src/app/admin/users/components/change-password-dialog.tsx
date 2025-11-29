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
import { Key } from "lucide-react"
import { changeUserPassword } from "../actions/user-actions"
import { useUserDialogStore } from "../stores/user-dialog-store"

interface ChangePasswordDialogProps {
    userId: string
    userName: string | null
}

export function ChangePasswordDialog({ userId, userName }: ChangePasswordDialogProps) {
    const router = useRouter()
    const isOpen = useUserDialogStore((state) => state.changePasswordDialog.isOpen)
    const data = useUserDialogStore((state) => state.changePasswordDialog.data)
    const isLoading = useUserDialogStore((state) => state.changePasswordDialog.isLoading)
    const error = useUserDialogStore((state) => state.changePasswordDialog.error)
    const openChangePasswordDialog = useUserDialogStore((state) => state.openChangePasswordDialog)
    const closeChangePasswordDialog = useUserDialogStore((state) => state.closeChangePasswordDialog)
    const setChangePasswordData = useUserDialogStore((state) => state.setChangePasswordData)
    const setChangePasswordLoading = useUserDialogStore((state) => state.setChangePasswordLoading)
    const setChangePasswordError = useUserDialogStore((state) => state.setChangePasswordError)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!data) return

        setChangePasswordLoading(true)

        const result = await changeUserPassword(data)

        if (result.error) {
            setChangePasswordError(result.error)
        } else {
            closeChangePasswordDialog()
            router.refresh()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={closeChangePasswordDialog}>
            <Button variant="ghost" size="sm" onClick={() => openChangePasswordDialog(userId)}>
                <Key className="h-4 w-4" />
            </Button>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                        Set a new password for {userName}. As an admin, you can change passwords
                        without knowing the current one.
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
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={data?.newPassword || ""}
                                onChange={(e) =>
                                    setChangePasswordData({ newPassword: e.target.value })
                                }
                                required
                                minLength={6}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={closeChangePasswordDialog}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Changing..." : "Change Password"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
