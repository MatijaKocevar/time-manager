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
import { Plus } from "lucide-react"
import { createUser } from "../actions/user-actions"
import { useUserDialogStore } from "../stores/user-dialog-store"
import type { UserRole } from "@/types"

export function CreateUserDialog() {
    const router = useRouter()
    const isOpen = useUserDialogStore((state) => state.createDialog.isOpen)
    const data = useUserDialogStore((state) => state.createDialog.data)
    const isLoading = useUserDialogStore((state) => state.createDialog.isLoading)
    const error = useUserDialogStore((state) => state.createDialog.error)
    const openCreateDialog = useUserDialogStore((state) => state.openCreateDialog)
    const closeCreateDialog = useUserDialogStore((state) => state.closeCreateDialog)
    const setCreateDialogData = useUserDialogStore((state) => state.setCreateDialogData)
    const resetCreateDialogData = useUserDialogStore((state) => state.resetCreateDialogData)
    const setCreateLoading = useUserDialogStore((state) => state.setCreateLoading)
    const setCreateError = useUserDialogStore((state) => state.setCreateError)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreateLoading(true)

        const result = await createUser(data)

        if (result.error) {
            setCreateError(result.error)
        } else {
            closeCreateDialog()
            resetCreateDialogData()
            router.refresh()
        }
    }

    return (
        <>
            <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add User
            </Button>
            <Dialog open={isOpen} onOpenChange={closeCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                            Add a new user to the system. They will be able to log in with the
                            provided credentials.
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
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setCreateDialogData({ name: e.target.value })}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setCreateDialogData({ email: e.target.value })}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setCreateDialogData({ password: e.target.value })
                                    }
                                    required
                                    minLength={6}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <select
                                    id="role"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={data.role}
                                    onChange={(e) =>
                                        setCreateDialogData({ role: e.target.value as UserRole })
                                    }
                                    disabled={isLoading}
                                >
                                    <option value="USER">User</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={closeCreateDialog}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Creating..." : "Create User"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
