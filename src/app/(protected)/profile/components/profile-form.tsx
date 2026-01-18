"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { UserAvatar } from "@/components/user-avatar"
import { Eye, EyeOff, AlertTriangle } from "lucide-react"
import { updateProfile } from "../actions/profile-actions"
import { useProfileStore } from "../stores/profile-store"
import { DeactivateAccountDialog } from "./deactivate-account-dialog"
import {
    MIN_PASSWORD_LENGTH,
    ROLE_COLORS,
    TIME_PICKER_CONFIG,
    DEFAULT_WORK_HOURS,
} from "../constants/profile-constants"
import type { UserRole } from "@/types"

interface ProfileFormProps {
    user: {
        id: string
        name: string | null
        email: string
        role: UserRole
        isDemo: boolean
        workStartTime: string | null
        workEndTime: string | null
        workHoursPerDay: number | null
    }
}

export function ProfileForm({ user }: ProfileFormProps) {
    const router = useRouter()
    const t = useTranslations("profile.form")
    const tWorkHours = useTranslations("profile.workHours")
    const tValidation = useTranslations("profile.validation")
    const tMessages = useTranslations("profile.messages")
    const tCommon = useTranslations("common")
    const tCommonMessages = useTranslations("common.messages")

    const [showPassword, setShowPassword] = useState(false)
    const [confirmPassword, setConfirmPassword] = useState("")
    const [name, setName] = useState(user.name || "")
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
    const [workStartTime, setWorkStartTime] = useState(
        user.workStartTime || DEFAULT_WORK_HOURS.START_TIME
    )
    const [workEndTime, setWorkEndTime] = useState(user.workEndTime || DEFAULT_WORK_HOURS.END_TIME)

    const isLoading = useProfileStore((state) => state.isLoading)
    const error = useProfileStore((state) => state.error)
    const success = useProfileStore((state) => state.success)
    const setLoading = useProfileStore((state) => state.setLoading)
    const setError = useProfileStore((state) => state.setError)
    const setSuccess = useProfileStore((state) => state.setSuccess)

    const timeOptions = Array.from({ length: TIME_PICKER_CONFIG.TOTAL_INTERVALS }, (_, i) => {
        const hours = Math.floor(i / TIME_PICKER_CONFIG.INTERVALS_PER_HOUR)
        const minutes =
            (i % TIME_PICKER_CONFIG.INTERVALS_PER_HOUR) * TIME_PICKER_CONFIG.MINUTES_PER_INTERVAL
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
            setError(tValidation("passwordsDoNotMatch"))
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
            const errorMessage = result.error.startsWith("profile.")
                ? tValidation(result.error.split(".").pop() as never)
                : result.error
            setError(errorMessage)
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
                            <CardTitle>{t("title")}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <CardDescription>{t("description")}</CardDescription>
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
                            {tMessages("updateSuccess")}
                        </div>
                    )}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t("name")}</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">{t("email")}</Label>
                            <Input id="email" value={user.email} disabled />
                            <p className="text-xs text-muted-foreground">{t("emailReadOnly")}</p>
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-medium">{tWorkHours("title")}</h3>
                            <p className="text-xs text-muted-foreground">
                                {tWorkHours("description")}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="work-start-time">{tWorkHours("startTime")}</Label>
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
                                <Label htmlFor="work-end-time">{tWorkHours("endTime")}</Label>
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
                            {tWorkHours("hoursPerDay")}:{" "}
                            {t("hoursPerDayDisplay", { hours: hoursPerDay.toFixed(2) })}
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-medium">{t("changePasswordTitle")}</h3>
                            <p className="text-xs text-muted-foreground">
                                {t("changePasswordDescription")}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="current-password">{t("currentPassword")}</Label>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="relative">
                                        <Input
                                            id="current-password"
                                            type={showPassword ? "text" : "password"}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            disabled={isLoading || user.isDemo}
                                            className="pr-10"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowPassword(!showPassword)}
                                            disabled={isLoading || user.isDemo}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </Button>
                                    </div>
                                </TooltipTrigger>
                                {user.isDemo && (
                                    <TooltipContent>
                                        {tCommonMessages("demoRestriction")}
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">{t("newPassword")}</Label>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="relative">
                                        <Input
                                            id="new-password"
                                            type={showPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            minLength={MIN_PASSWORD_LENGTH}
                                            disabled={isLoading || user.isDemo}
                                            className="pr-10"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowPassword(!showPassword)}
                                            disabled={isLoading || user.isDemo}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </Button>
                                    </div>
                                </TooltipTrigger>
                                {user.isDemo && (
                                    <TooltipContent>
                                        {tCommonMessages("demoRestriction")}
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">{t("confirmPassword")}</Label>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="relative">
                                        <Input
                                            id="confirm-password"
                                            type={showPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            minLength={MIN_PASSWORD_LENGTH}
                                            disabled={isLoading || user.isDemo}
                                            className="pr-10"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowPassword(!showPassword)}
                                            disabled={isLoading || user.isDemo}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </Button>
                                    </div>
                                </TooltipTrigger>
                                {user.isDemo && (
                                    <TooltipContent>
                                        {tCommonMessages("demoRestriction")}
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? tCommon("status.saving") : t("saveChanges")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="mt-4">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        {t("dangerZone")}
                    </CardTitle>
                    <CardDescription>{t("dangerZoneDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="inline-block">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => setShowDeactivateDialog(true)}
                                    disabled={isLoading || user.isDemo}
                                >
                                    {t("deactivateButton")}
                                </Button>
                            </div>
                        </TooltipTrigger>
                        {user.isDemo && (
                            <TooltipContent>{tCommonMessages("demoRestriction")}</TooltipContent>
                        )}
                    </Tooltip>
                </CardContent>
            </Card>

            <DeactivateAccountDialog
                open={showDeactivateDialog}
                onOpenChange={setShowDeactivateDialog}
            />
        </form>
    )
}
