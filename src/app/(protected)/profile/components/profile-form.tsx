"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { UserAvatar } from "@/components/user-avatar"
import { updateProfile } from "../actions/profile-actions"
import { useProfileStore } from "../stores/profile-store"
import { MIN_PASSWORD_LENGTH, ROLE_COLORS } from "../constants/profile-constants"
import type { UserRole } from "@/types"

interface ProfileFormProps {
    user: {
        id: string
        name: string | null
        email: string
        role: UserRole
    }
}

export function ProfileForm({ user }: ProfileFormProps) {
    const router = useRouter()
    const formData = useProfileStore((state) => state.formData)
    const isLoading = useProfileStore((state) => state.isLoading)
    const error = useProfileStore((state) => state.error)
    const success = useProfileStore((state) => state.success)
    const setFormData = useProfileStore((state) => state.setFormData)
    const resetFormData = useProfileStore((state) => state.resetFormData)
    const setLoading = useProfileStore((state) => state.setLoading)
    const setError = useProfileStore((state) => state.setError)
    const setSuccess = useProfileStore((state) => state.setSuccess)

    useEffect(() => {
        resetFormData(user.name || "")
    }, [user.name, resetFormData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setSuccess(false)

        const input = {
            name: formData.name,
            ...(formData.currentPassword && { currentPassword: formData.currentPassword }),
            ...(formData.newPassword && { newPassword: formData.newPassword }),
        }

        const result = await updateProfile(input)

        if (result.error) {
            setError(result.error)
        } else {
            setSuccess(true)
            setFormData({ currentPassword: "", newPassword: "" })
            setLoading(false)
            router.refresh()
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <UserAvatar role={user.role} className="h-16 w-16" />
                        <div className="flex-1">
                            <CardTitle>Profile Information</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <CardDescription>Update your name and password</CardDescription>
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[user.role]}`}
                                >
                                    {user.role}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
                    )}
                    {success && (
                        <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                            Profile updated successfully
                        </div>
                    )}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ name: e.target.value })}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={user.email} disabled />
                            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-medium">Change Password</h3>
                            <p className="text-xs text-muted-foreground">
                                Leave empty to keep current password
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input
                                id="current-password"
                                type="password"
                                value={formData.currentPassword}
                                onChange={(e) => setFormData({ currentPassword: e.target.value })}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ newPassword: e.target.value })}
                                minLength={MIN_PASSWORD_LENGTH}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    )
}
