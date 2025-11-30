"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUserFormStore } from "../stores/user-form-store"
import { createUser, updateUser, deleteUser, changeUserPassword } from "../actions/user-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Trash2 } from "lucide-react"
import type { UserRole } from "@/types"

interface UserFormProps {
    user?: {
        id: string
        name: string | null
        email: string
        role: UserRole
    }
}

export function UserForm({ user }: UserFormProps) {
    const router = useRouter()
    const isEditMode = !!user

    const name = useUserFormStore((state) => state.createForm.data.name)
    const email = useUserFormStore((state) => state.createForm.data.email)
    const password = useUserFormStore((state) => state.createForm.data.password)
    const role = useUserFormStore((state) => state.createForm.data.role)
    const newPassword = useUserFormStore(
        (state) => state.changePasswordForm.data?.newPassword || ""
    )
    const isLoading = useUserFormStore((state) => state.createForm.isLoading)
    const isPasswordLoading = useUserFormStore((state) => state.changePasswordForm.isLoading)
    const isDeleteLoading = useUserFormStore((state) => state.deleteForm.isLoading)
    const error = useUserFormStore((state) => state.createForm.error)
    const passwordError = useUserFormStore((state) => state.changePasswordForm.error)
    const deleteError = useUserFormStore((state) => state.deleteForm.error)
    const setFormData = useUserFormStore((state) => state.setCreateFormData)
    const setPasswordData = useUserFormStore((state) => state.setChangePasswordFormData)
    const setLoading = useUserFormStore((state) => state.setCreateLoading)
    const setPasswordLoading = useUserFormStore((state) => state.setChangePasswordLoading)
    const setDeleteLoading = useUserFormStore((state) => state.setDeleteLoading)
    const setError = useUserFormStore((state) => state.setCreateError)
    const setPasswordError = useUserFormStore((state) => state.setChangePasswordError)
    const setDeleteError = useUserFormStore((state) => state.setDeleteError)
    const clearError = useUserFormStore((state) => state.clearCreateError)
    const clearPasswordError = useUserFormStore((state) => state.clearChangePasswordError)
    const clearDeleteError = useUserFormStore((state) => state.clearDeleteError)
    const resetForm = useUserFormStore((state) => state.resetCreateForm)
    const initializePasswordForm = useUserFormStore((state) => state.initializeChangePasswordForm)

    useEffect(() => {
        if (user) {
            setFormData({ name: user.name || "", email: user.email, role: user.role })
            initializePasswordForm(user.id)
        }
        return () => resetForm()
    }, [user, setFormData, initializePasswordForm, resetForm])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        clearError()
        setLoading(true)

        let result
        if (isEditMode) {
            result = await updateUser({
                id: user.id,
                name: name || "",
                role,
            })
        } else {
            result = await createUser({ name, email, password, role })
        }

        setLoading(false)

        if (result.error) {
            setError(result.error)
        } else {
            resetForm()
            router.push("/admin/users")
        }
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        clearPasswordError()
        setPasswordLoading(true)

        const result = await changeUserPassword({
            id: user.id,
            newPassword,
        })

        setPasswordLoading(false)

        if (result.error) {
            setPasswordError(result.error)
        } else {
            setPasswordData({ newPassword: "" })
        }
    }

    const handleDelete = async () => {
        if (!user || !confirm(`Are you sure you want to delete ${user.name || "this user"}?`))
            return

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
                        onChange={(e) => setFormData({ name: e.target.value })}
                        disabled={isLoading}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setFormData({ email: e.target.value })}
                        disabled={isLoading || isEditMode}
                    />
                </div>
                {!isEditMode && (
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setFormData({ password: e.target.value })}
                            disabled={isLoading}
                        />
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <select
                        id="role"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={role}
                        onChange={(e) => setFormData({ role: e.target.value as UserRole })}
                        disabled={isLoading}
                    >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/users")}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading
                            ? isEditMode
                                ? "Saving..."
                                : "Creating..."
                            : isEditMode
                              ? "Save Changes"
                              : "Create User"}
                    </Button>
                </div>
            </form>

            {isEditMode && (
                <>
                    <Separator />
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Change Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setPasswordData({ newPassword: e.target.value })}
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
                                Permanently remove this user from the system. This action cannot be
                                undone.
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
                </>
            )}
        </div>
    )
}
