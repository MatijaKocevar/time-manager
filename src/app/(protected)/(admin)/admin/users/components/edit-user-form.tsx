"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateUser, deleteUser, changeUserPassword } from "../actions/user-actions"
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
import type { UserRole } from "@/types"

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
    const [name, setName] = useState(user.name || "")
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
    const [newPassword, setNewPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isPasswordLoading, setIsPasswordLoading] = useState(false)
    const [isDeleteLoading, setIsDeleteLoading] = useState(false)
    const [error, setError] = useState("")
    const [passwordError, setPasswordError] = useState("")
    const [deleteError, setDeleteError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        const result = await updateUser({
            id: user.id,
            name,
            role: selectedRole || user.role,
        })

        setIsLoading(false)

        if (result.error) {
            setError(result.error)
        } else {
            router.push("/admin/users")
        }
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setPasswordError("")
        setIsPasswordLoading(true)

        const result = await changeUserPassword({
            id: user.id,
            newPassword,
        })

        setIsPasswordLoading(false)

        if (result.error) {
            setPasswordError(result.error)
        } else {
            setNewPassword("")
        }
    }

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${user.name || "this user"}?`)) return

        setDeleteError("")
        setIsDeleteLoading(true)

        const result = await deleteUser({ id: user.id })

        setIsDeleteLoading(false)

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
                        onChange={(e) => setName(e.target.value)}
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
                        defaultValue={user.role}
                        onValueChange={(value: string) => setSelectedRole(value as UserRole)}
                        disabled={isLoading}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USER">User</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
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
                        onChange={(e) => setNewPassword(e.target.value)}
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
