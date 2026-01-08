"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { UserAvatar } from "@/components/user-avatar"
import { Eye, EyeOff } from "lucide-react"
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
        workStartTime: string | null
        workEndTime: string | null
        workHoursPerDay: number | null
    }
    workHoursTranslations: {
        title: string
        description: string
        startTime: string
        endTime: string
        hoursPerDay: string
    }
}

export function ProfileForm({ user, workHoursTranslations }: ProfileFormProps) {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [confirmPassword, setConfirmPassword] = useState("")
    const [name, setName] = useState(user.name || "")
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [workStartTime, setWorkStartTime] = useState(user.workStartTime || "08:00")
    const [workEndTime, setWorkEndTime] = useState(user.workEndTime || "16:00")

    const isLoading = useProfileStore((state) => state.isLoading)
    const error = useProfileStore((state) => state.error)
    const success = useProfileStore((state) => state.success)
    const setLoading = useProfileStore((state) => state.setLoading)
    const setError = useProfileStore((state) => state.setError)
    const setSuccess = useProfileStore((state) => state.setSuccess)

    const timeOptions = Array.from({ length: 96 }, (_, i) => {
        const hours = Math.floor(i / 4)
        const minutes = (i % 4) * 15
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    })

    const calculateHoursPerDay = (start: string, end: string): number => {
        const [startH, startM] = start.split(":").map(Number)
        const [endH, endM] = end.split(":").map(Number)
        return (endH * 60 + endM - startH * 60 - startM) / 60
    }

    const hoursPerDay = calculateHoursPerDay(workStartTime, workEndTime)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setSuccess(false)
        setError("")

        if (newPassword && newPassword !== confirmPassword) {
            setError("Passwords do not match")
            setLoading(false)
            return
        }

        const input = {
            name,
            ...(currentPassword && { currentPassword }),
            ...(newPassword && { newPassword }),
            workStartTime,
            workEndTime,
        }

        const result = await updateProfile(input)

        if (result.error) {
            setError(result.error)
            setLoading(false)
        } else {
            setSuccess(true)
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
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
                                value={name}
                                onChange={(e) => setName(e.target.value)}
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
                            <h3 className="text-sm font-medium">{workHoursTranslations.title}</h3>
                            <p className="text-xs text-muted-foreground">
                                {workHoursTranslations.description}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="work-start-time">
                                    {workHoursTranslations.startTime}
                                </Label>
                                <Select
                                    value={workStartTime}
                                    onValueChange={setWorkStartTime}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger id="work-start-time">
                                        <SelectValue>{workStartTime}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {timeOptions.map((time) => (
                                            <SelectItem key={time} value={time}>
                                                {time}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="work-end-time">
                                    {workHoursTranslations.endTime}
                                </Label>
                                <Select
                                    value={workEndTime}
                                    onValueChange={setWorkEndTime}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger id="work-end-time">
                                        <SelectValue>{workEndTime}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {timeOptions.map((time) => (
                                            <SelectItem key={time} value={time}>
                                                {time}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {workHoursTranslations.hoursPerDay}: {hoursPerDay.toFixed(2)} hours
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
                            <div className="relative">
                                <Input
                                    id="current-password"
                                    type={showPassword ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    disabled={isLoading}
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="new-password"
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    minLength={MIN_PASSWORD_LENGTH}
                                    disabled={isLoading}
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirm-password"
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    minLength={MIN_PASSWORD_LENGTH}
                                    disabled={isLoading}
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </div>
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
