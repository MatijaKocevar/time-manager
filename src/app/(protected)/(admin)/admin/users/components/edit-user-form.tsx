"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { updateUser, deleteUser, changeUserPassword } from "../actions/user-actions"
import { useUserFormStore } from "../stores/user-form-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Trash2 } from "lucide-react"
import { USER_ROLE_LABELS } from "../constants/user-constants"
import { type UserRole } from "../schemas/user-action-schemas"

interface EditUserFormProps {
    user: {
        id: string
        name: string | null
        email: string
        role: UserRole
    }
}

export function EditUserForm({ user }: EditUserFormProps) {
    const router = useRouter()

    const editData = useUserFormStore((state) => state.editForm.data)
    const name = editData?.name || ""
    const role = editData?.role || user.role
    const newPassword = useUserFormStore(
        (state) => state.changePasswordForm.data?.newPassword || ""
    )

    const isLoading = useUserFormStore((state) => state.editForm.isLoading)
    const isPasswordLoading = useUserFormStore((state) => state.changePasswordForm.isLoading)
    const isDeleteLoading = useUserFormStore((state) => state.deleteForm.isLoading)

    const error = useUserFormStore((state) => state.editForm.error)
    const passwordError = useUserFormStore((state) => state.changePasswordForm.error)
    const deleteError = useUserFormStore((state) => state.deleteForm.error)

    const initializeEditForm = useUserFormStore((state) => state.initializeEditForm)
    const initializeChangePasswordForm = useUserFormStore(
        (state) => state.initializeChangePasswordForm
    )
    const setEditFormData = useUserFormStore((state) => state.setEditFormData)
    const setChangePasswordFormData = useUserFormStore((state) => state.setChangePasswordFormData)
    const setEditLoading = useUserFormStore((state) => state.setEditLoading)
    const setChangePasswordLoading = useUserFormStore((state) => state.setChangePasswordLoading)
    const setDeleteLoading = useUserFormStore((state) => state.setDeleteLoading)
    const setEditError = useUserFormStore((state) => state.setEditError)
    const setChangePasswordError = useUserFormStore((state) => state.setChangePasswordError)
    const setDeleteError = useUserFormStore((state) => state.setDeleteError)
    const clearEditError = useUserFormStore((state) => state.clearEditError)
    const clearChangePasswordError = useUserFormStore((state) => state.clearChangePasswordError)
    const clearDeleteError = useUserFormStore((state) => state.clearDeleteError)
    const resetEditForm = useUserFormStore((state) => state.resetEditForm)
    const resetChangePasswordForm = useUserFormStore((state) => state.resetChangePasswordForm)

    useEffect(() => {
        initializeEditForm({ id: user.id, name: user.name, role: user.role })
        initializeChangePasswordForm(user.id)

        return () => {
            resetEditForm()
            resetChangePasswordForm()
        }
    }, [
        user.id,
        user.name,
        user.role,
        initializeEditForm,
        initializeChangePasswordForm,
        resetEditForm,
        resetChangePasswordForm,
    ])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        clearEditError()
        setEditLoading(true)

        const result = await updateUser({
            id: user.id,
            name,
            role,
        })

        setEditLoading(false)

        if (result.error) {
            setEditError(result.error)
        } else {
            router.push("/admin/users")
        }
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        clearChangePasswordError()
        setChangePasswordLoading(true)

        const result = await changeUserPassword({
            id: user.id,
            newPassword,
        })

        setChangePasswordLoading(false)

        if (result.error) {
            setChangePasswordError(result.error)
        } else {
            setChangePasswordFormData({ newPassword: "" })
        }
    }

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${user.name || "this user"}?`)) return

        clearDeleteError()
        setDeleteLoading(true)

        const result = await deleteUser({ id: user.id })

        setDeleteLoading(false)

        if (result.error) {
            setDeleteError(result.error)
        } else {
            router.push("/admin/users")
        }
    }

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setEditFormData({ name: e.target.value })}
                        disabled={isLoading}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={user.email} disabled />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                        key={user.id}
                        value={role}
                        onValueChange={(value: string) =>
                            setEditFormData({ role: value as UserRole })
                        }
                        disabled={isLoading}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USER">{USER_ROLE_LABELS.USER}</SelectItem>
                            <SelectItem value="ADMIN">{USER_ROLE_LABELS.ADMIN}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/admin/users")}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>

            <Separator />
            <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="newPassword">Change Password</Label>
                    <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setChangePasswordFormData({ newPassword: e.target.value })}
                        disabled={isPasswordLoading}
                    />
                </div>
                {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
                <div className="flex justify-end">
                    <Button type="submit" disabled={isPasswordLoading || !newPassword}>
                        {isPasswordLoading ? "Changing..." : "Change Password"}
                    </Button>
                </div>
            </form>

            <Separator />
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-medium">Delete User</h3>
                    <p className="text-sm text-muted-foreground">
                        Permanently remove this user from the system. This action cannot be undone.
                    </p>
                </div>
                {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
                <div className="flex justify-end">
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleteLoading}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeleteLoading ? "Deleting..." : "Delete User"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
