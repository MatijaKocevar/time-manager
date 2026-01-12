"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
    updateUser,
    changeUserPassword,
    deactivateUser,
    reactivateUser,
    anonymizeUser,
} from "../actions/user-actions"
import { useUserFormStore } from "../stores/user-form-store"
import { Button } from "@/components/ui/button"
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
import { Eye, EyeOff } from "lucide-react"
import { getUserRoleTranslationKey } from "../utils/translation-helpers"
import { type UserRole } from "../schemas/user-action-schemas"

interface EditUserFormProps {
    user: {
        id: string
        name: string | null
        email: string
        role: UserRole
        isDemo: boolean
        isActive: boolean
        deactivatedAt: Date | null
        anonymizedAt: Date | null
    }
    currentUserIsDemo: boolean
}

export function EditUserForm({ user, currentUserIsDemo }: EditUserFormProps) {
    const router = useRouter()
    const t = useTranslations("admin.users.form")
    const tRoles = useTranslations("admin.users.roles")
    const tCommon = useTranslations("common.actions")
    const tCommonMessages = useTranslations("common.messages")

    const [name, setName] = useState(user.name ?? "")
    const [role, setRole] = useState<UserRole>(user.role)
    const [showPassword, setShowPassword] = useState(false)
    const [confirmPassword, setConfirmPassword] = useState("")

    const newPassword = useUserFormStore(
        (state) => state.changePasswordForm.data?.newPassword || ""
    )

    const isLoading = useUserFormStore((state) => state.editForm.isLoading)
    const isPasswordLoading = useUserFormStore((state) => state.changePasswordForm.isLoading)
    const isDeactivateLoading = useUserFormStore((state) => state.deactivateForm.isLoading)
    const isReactivateLoading = useUserFormStore((state) => state.reactivateForm.isLoading)
    const isAnonymizeLoading = useUserFormStore((state) => state.anonymizeForm.isLoading)

    const error = useUserFormStore((state) => state.editForm.error)
    const passwordError = useUserFormStore((state) => state.changePasswordForm.error)
    const deactivateError = useUserFormStore((state) => state.deactivateForm.error)
    const reactivateError = useUserFormStore((state) => state.reactivateForm.error)
    const anonymizeError = useUserFormStore((state) => state.anonymizeForm.error)

    const setChangePasswordFormData = useUserFormStore((state) => state.setChangePasswordFormData)
    const setEditLoading = useUserFormStore((state) => state.setEditLoading)
    const setChangePasswordLoading = useUserFormStore((state) => state.setChangePasswordLoading)
    const setDeactivateLoading = useUserFormStore((state) => state.setDeactivateLoading)
    const setReactivateLoading = useUserFormStore((state) => state.setReactivateLoading)
    const setAnonymizeLoading = useUserFormStore((state) => state.setAnonymizeLoading)
    const setEditError = useUserFormStore((state) => state.setEditError)
    const setChangePasswordError = useUserFormStore((state) => state.setChangePasswordError)
    const setDeactivateError = useUserFormStore((state) => state.setDeactivateError)
    const setReactivateError = useUserFormStore((state) => state.setReactivateError)
    const setAnonymizeError = useUserFormStore((state) => state.setAnonymizeError)
    const clearEditError = useUserFormStore((state) => state.clearEditError)
    const clearChangePasswordError = useUserFormStore((state) => state.clearChangePasswordError)
    const clearDeactivateError = useUserFormStore((state) => state.clearDeactivateError)
    const clearReactivateError = useUserFormStore((state) => state.clearReactivateError)
    const clearAnonymizeError = useUserFormStore((state) => state.clearAnonymizeError)
    const initializePasswordForm = useUserFormStore((state) => state.initializeChangePasswordForm)

    useEffect(() => {
        initializePasswordForm(user.id)
    }, [user.id, initializePasswordForm])

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

        if (newPassword !== confirmPassword) {
            setChangePasswordError(t("passwordMismatch"))
            return
        }

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
            setConfirmPassword("")
        }
    }

    const handleDeactivate = async () => {
        if (!confirm(t("deactivateConfirm", { name: user.name || "this user" }))) return

        clearDeactivateError()
        setDeactivateLoading(true)

        const result = await deactivateUser({ id: user.id })

        setDeactivateLoading(false)

        if (result.error) {
            setDeactivateError(result.error)
        } else {
            router.refresh()
        }
    }

    const handleReactivate = async () => {
        if (!confirm(t("reactivateConfirm", { name: user.name || "this user" }))) return

        clearReactivateError()
        setReactivateLoading(true)

        const result = await reactivateUser({ id: user.id })

        setReactivateLoading(false)

        if (result.error) {
            setReactivateError(result.error)
        } else {
            router.refresh()
        }
    }

    const handleAnonymize = async () => {
        if (!confirm(t("anonymizeConfirm", { name: user.name || "this user" }))) return

        clearAnonymizeError()
        setAnonymizeLoading(true)

        const result = await anonymizeUser({ id: user.id })

        setAnonymizeLoading(false)

        if (result.error) {
            setAnonymizeError(result.error)
        } else {
            router.push("/admin/users")
        }
    }

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">{t("name")}</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">{t("email")}</Label>
                    <Input id="email" type="email" value={user.email} disabled />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="role">{t("role")}</Label>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div>
                                <Select
                                    value={role}
                                    onValueChange={(value: string) => setRole(value as UserRole)}
                                    disabled={
                                        isLoading ||
                                        user.isDemo ||
                                        (currentUserIsDemo && role !== "ADMIN")
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue>
                                            {tRoles(getUserRoleTranslationKey(role))}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USER">
                                            {tRoles(getUserRoleTranslationKey("USER"))}
                                        </SelectItem>
                                        <SelectItem value="ADMIN" disabled={currentUserIsDemo}>
                                            {tRoles(getUserRoleTranslationKey("ADMIN"))}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </TooltipTrigger>
                        {(user.isDemo || currentUserIsDemo) && (
                            <TooltipContent>{tCommonMessages("demoRestriction")}</TooltipContent>
                        )}
                    </Tooltip>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/admin/users")}
                        disabled={isLoading}
                    >
                        {tCommon("cancel")}
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? t("saving") : t("saveChanges")}
                    </Button>
                </div>
            </form>

            <Separator />
            <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="newPassword">{t("changePassword")}</Label>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder={t("enterNewPassword")}
                                    value={newPassword}
                                    onChange={(e) =>
                                        setChangePasswordFormData({ newPassword: e.target.value })
                                    }
                                    disabled={isPasswordLoading || user.isDemo}
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isPasswordLoading || user.isDemo}
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
                            <TooltipContent>{tCommonMessages("demoRestriction")}</TooltipContent>
                        )}
                    </Tooltip>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder={t("confirmNewPassword")}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isPasswordLoading || user.isDemo}
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isPasswordLoading || user.isDemo}
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
                            <TooltipContent>{tCommonMessages("demoRestriction")}</TooltipContent>
                        )}
                    </Tooltip>
                </div>
                {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
                <div className="flex justify-end">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="inline-block">
                                <Button
                                    type="submit"
                                    disabled={
                                        isPasswordLoading ||
                                        !newPassword ||
                                        !confirmPassword ||
                                        user.isDemo
                                    }
                                >
                                    {isPasswordLoading ? t("changing") : t("changePassword")}
                                </Button>
                            </div>
                        </TooltipTrigger>
                        {user.isDemo && (
                            <TooltipContent>{tCommonMessages("demoRestriction")}</TooltipContent>
                        )}
                    </Tooltip>
                </div>
            </form>

            <Separator />
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-medium">
                        {user.isActive ? t("deactivateUser") : t("reactivateUser")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {user.isActive
                            ? t("deactivateConfirm", { name: "" }).split("?")[0]
                            : t("reactivateConfirm", { name: "" }).split("?")[0]}
                    </p>
                </div>
                {deactivateError && <p className="text-sm text-red-500">{deactivateError}</p>}
                {reactivateError && <p className="text-sm text-red-500">{reactivateError}</p>}
                <div className="flex justify-end">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="inline-block">
                                {user.isActive ? (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={handleDeactivate}
                                        disabled={
                                            isDeactivateLoading ||
                                            !!user.anonymizedAt ||
                                            user.isDemo
                                        }
                                    >
                                        {isDeactivateLoading
                                            ? t("deactivating")
                                            : t("deactivateUser")}
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={handleReactivate}
                                        disabled={
                                            isReactivateLoading ||
                                            !!user.anonymizedAt ||
                                            user.isDemo
                                        }
                                    >
                                        {isReactivateLoading
                                            ? t("reactivating")
                                            : t("reactivateUser")}
                                    </Button>
                                )}
                            </div>
                        </TooltipTrigger>
                        {user.isDemo && (
                            <TooltipContent>{tCommonMessages("demoRestriction")}</TooltipContent>
                        )}
                    </Tooltip>
                </div>
            </div>

            {!user.isActive && !user.anonymizedAt && (
                <>
                    <Separator />
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-medium">{t("anonymizeUser")}</h3>
                            <p className="text-sm text-muted-foreground">
                                {t("anonymizeConfirm", { name: "" }).split("?")[0]}
                            </p>
                        </div>
                        {anonymizeError && <p className="text-sm text-red-500">{anonymizeError}</p>}
                        <div className="flex justify-end">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="inline-block">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={handleAnonymize}
                                            disabled={isAnonymizeLoading || user.isDemo}
                                        >
                                            {isAnonymizeLoading
                                                ? t("anonymizing")
                                                : t("anonymizeUser")}
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
                </>
            )}
        </div>
    )
}
