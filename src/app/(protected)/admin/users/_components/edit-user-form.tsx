"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Eye, EyeOff } from "lucide-react"
import { type UserRole } from "../_schemas/user-action-schemas"
import { USER_ROLE_COLORS } from "../_constants/user-constants"
import { useEditUserForm } from "../_hooks/use-edit-user-form"

interface EditUserFormUser {
    id: string
    name: string | null
    email: string
    role: UserRole
    isDemo: boolean
    isActive: boolean
    deactivatedAt: Date | null
    anonymizedAt: Date | null
}

interface EditUserFormTranslations {
    nameLabel: string
    emailLabel: string
    roleLabel: string
    roleLabels: Record<UserRole, string>
    saving: string
    saveChanges: string
    cancel: string
    changePasswordLabel: string
    enterNewPasswordPlaceholder: string
    demoRestriction: string
    confirmPasswordLabel: string
    confirmNewPasswordPlaceholder: string
    changing: string
    deactivateUserLabel: string
    reactivateUserLabel: string
    deactivateDescription: string
    reactivateDescription: string
    deactivating: string
    reactivating: string
    anonymizeUserLabel: string
    anonymizeDescription: string
    anonymizing: string
    passwordMismatch: string
    deactivateConfirmMsg: string
    reactivateConfirmMsg: string
    anonymizeConfirmMsg: string
}

interface EditUserFormClientProps {
    user: EditUserFormUser
    currentUserIsDemo: boolean
    translations: EditUserFormTranslations
}

export function EditUserFormClient({
    user,
    currentUserIsDemo,
    translations,
}: EditUserFormClientProps) {
    const {
        name,
        role,
        newPassword,
        showPassword,
        confirmPassword,
        isLoading,
        isPasswordLoading,
        isDeactivateLoading,
        isReactivateLoading,
        isAnonymizeLoading,
        error,
        passwordError,
        deactivateError,
        reactivateError,
        anonymizeError,
        setName,
        setRole,
        setNewPassword,
        setShowPassword,
        setConfirmPassword,
        handleSubmit,
        handleChangePassword,
        handleDeactivate,
        handleReactivate,
        handleAnonymize,
    } = useEditUserForm({ user, currentUserIsDemo, translations })

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">{translations.nameLabel}</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">{translations.emailLabel}</Label>
                    <Input id="email" type="email" value={user.email} disabled />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="role">{translations.roleLabel}</Label>
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
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${USER_ROLE_COLORS[role]}`}
                                            >
                                                {translations.roleLabels[role]}
                                            </span>
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USER">
                                            {translations.roleLabels["USER"]}
                                        </SelectItem>
                                        <SelectItem value="ADMIN" disabled={currentUserIsDemo}>
                                            {translations.roleLabels["ADMIN"]}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </TooltipTrigger>
                        {(user.isDemo || currentUserIsDemo) && (
                            <TooltipContent>{translations.demoRestriction}</TooltipContent>
                        )}
                    </Tooltip>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => history.back()}
                        disabled={isLoading}
                    >
                        {translations.cancel}
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? translations.saving : translations.saveChanges}
                    </Button>
                </div>
            </form>

            <Separator />
            <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="newPassword">{translations.changePasswordLabel}</Label>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder={translations.enterNewPasswordPlaceholder}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
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
                            <TooltipContent>{translations.demoRestriction}</TooltipContent>
                        )}
                    </Tooltip>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{translations.confirmPasswordLabel}</Label>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder={translations.confirmNewPasswordPlaceholder}
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
                            <TooltipContent>{translations.demoRestriction}</TooltipContent>
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
                                    {isPasswordLoading
                                        ? translations.changing
                                        : translations.changePasswordLabel}
                                </Button>
                            </div>
                        </TooltipTrigger>
                        {user.isDemo && (
                            <TooltipContent>{translations.demoRestriction}</TooltipContent>
                        )}
                    </Tooltip>
                </div>
            </form>

            <Separator />
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-medium">
                        {user.isActive
                            ? translations.deactivateUserLabel
                            : translations.reactivateUserLabel}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {user.isActive
                            ? translations.deactivateDescription
                            : translations.reactivateDescription}
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
                                            user.isDemo ||
                                            currentUserIsDemo
                                        }
                                    >
                                        {isDeactivateLoading
                                            ? translations.deactivating
                                            : translations.deactivateUserLabel}
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={handleReactivate}
                                        disabled={
                                            isReactivateLoading ||
                                            !!user.anonymizedAt ||
                                            user.isDemo ||
                                            currentUserIsDemo
                                        }
                                    >
                                        {isReactivateLoading
                                            ? translations.reactivating
                                            : translations.reactivateUserLabel}
                                    </Button>
                                )}
                            </div>
                        </TooltipTrigger>
                        {(user.isDemo || currentUserIsDemo) && (
                            <TooltipContent>{translations.demoRestriction}</TooltipContent>
                        )}
                    </Tooltip>
                </div>
            </div>

            {!user.isActive && !user.anonymizedAt && (
                <>
                    <Separator />
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-medium">
                                {translations.anonymizeUserLabel}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {translations.anonymizeDescription}
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
                                            disabled={
                                                isAnonymizeLoading ||
                                                user.isDemo ||
                                                currentUserIsDemo
                                            }
                                        >
                                            {isAnonymizeLoading
                                                ? translations.anonymizing
                                                : translations.anonymizeUserLabel}
                                        </Button>
                                    </div>
                                </TooltipTrigger>
                                {(user.isDemo || currentUserIsDemo) && (
                                    <TooltipContent>{translations.demoRestriction}</TooltipContent>
                                )}
                            </Tooltip>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
