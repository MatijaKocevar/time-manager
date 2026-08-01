"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    updateUser,
    changeUserPassword,
    deactivateUser,
    reactivateUser,
    anonymizeUser,
} from "../_actions/user-actions"
import { useUserFormStore } from "../_stores/user-form-store"
import { type UserRole } from "../_schemas/user-action-schemas"

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
    passwordMismatch: string
    deactivateConfirmMsg: string
    reactivateConfirmMsg: string
    anonymizeConfirmMsg: string
}

interface UseEditUserFormParams {
    user: EditUserFormUser
    currentUserIsDemo: boolean
    translations: EditUserFormTranslations
}

export function useEditUserForm({ user, translations }: UseEditUserFormParams) {
    const router = useRouter()

    const editFormData = useUserFormStore((s) => s.editForm.data)
    const isLoading = useUserFormStore((s) => s.editForm.isLoading)
    const isPasswordLoading = useUserFormStore((s) => s.changePasswordForm.isLoading)
    const isDeactivateLoading = useUserFormStore((s) => s.deactivateForm.isLoading)
    const isReactivateLoading = useUserFormStore((s) => s.reactivateForm.isLoading)
    const isAnonymizeLoading = useUserFormStore((s) => s.anonymizeForm.isLoading)
    const error = useUserFormStore((s) => s.editForm.error)
    const passwordError = useUserFormStore((s) => s.changePasswordForm.error)
    const deactivateError = useUserFormStore((s) => s.deactivateForm.error)
    const reactivateError = useUserFormStore((s) => s.reactivateForm.error)
    const anonymizeError = useUserFormStore((s) => s.anonymizeForm.error)
    const newPassword = useUserFormStore((s) => s.changePasswordForm.data?.newPassword ?? "")
    const showPassword = useUserFormStore((s) => s.showPassword)
    const confirmPassword = useUserFormStore((s) => s.confirmPassword)

    const initializeEditForm = useUserFormStore((s) => s.initializeEditForm)
    const initializePasswordForm = useUserFormStore((s) => s.initializeChangePasswordForm)
    const setEditFormData = useUserFormStore((s) => s.setEditFormData)
    const setChangePasswordFormData = useUserFormStore((s) => s.setChangePasswordFormData)
    const setShowPassword = useUserFormStore((s) => s.setShowPassword)
    const setConfirmPassword = useUserFormStore((s) => s.setConfirmPassword)
    const setEditLoading = useUserFormStore((s) => s.setEditLoading)
    const setChangePasswordLoading = useUserFormStore((s) => s.setChangePasswordLoading)
    const setDeactivateLoading = useUserFormStore((s) => s.setDeactivateLoading)
    const setReactivateLoading = useUserFormStore((s) => s.setReactivateLoading)
    const setAnonymizeLoading = useUserFormStore((s) => s.setAnonymizeLoading)
    const setEditError = useUserFormStore((s) => s.setEditError)
    const setChangePasswordError = useUserFormStore((s) => s.setChangePasswordError)
    const setDeactivateError = useUserFormStore((s) => s.setDeactivateError)
    const setReactivateError = useUserFormStore((s) => s.setReactivateError)
    const setAnonymizeError = useUserFormStore((s) => s.setAnonymizeError)
    const clearEditError = useUserFormStore((s) => s.clearEditError)
    const clearChangePasswordError = useUserFormStore((s) => s.clearChangePasswordError)
    const clearDeactivateError = useUserFormStore((s) => s.clearDeactivateError)
    const clearReactivateError = useUserFormStore((s) => s.clearReactivateError)
    const clearAnonymizeError = useUserFormStore((s) => s.clearAnonymizeError)

    useEffect(() => {
        initializeEditForm({ id: user.id, name: user.name, role: user.role })
        initializePasswordForm(user.id)
    }, [user.id, user.name, user.role, initializeEditForm, initializePasswordForm])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        clearEditError()
        setEditLoading(true)

        const result = await updateUser({
            id: user.id,
            name: editFormData?.name ?? "",
            role: editFormData?.role ?? user.role,
        })

        setEditLoading(false)

        if (result.error) {
            setEditError(result.error)
        } else {
            router.push("/admin/users")
        }
    }

    async function handleChangePassword(e: React.FormEvent) {
        e.preventDefault()
        clearChangePasswordError()

        if (newPassword !== confirmPassword) {
            setChangePasswordError(translations.passwordMismatch)
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

    async function handleDeactivate() {
        if (!confirm(translations.deactivateConfirmMsg)) return

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

    async function handleReactivate() {
        if (!confirm(translations.reactivateConfirmMsg)) return

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

    async function handleAnonymize() {
        if (!confirm(translations.anonymizeConfirmMsg)) return

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

    return {
        name: editFormData?.name ?? user.name ?? "",
        role: editFormData?.role ?? user.role,
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
        setName: (name: string) => setEditFormData({ name }),
        setRole: (role: UserRole) => setEditFormData({ role }),
        setNewPassword: (newPassword: string) => setChangePasswordFormData({ newPassword }),
        setShowPassword,
        setConfirmPassword,
        handleSubmit,
        handleChangePassword,
        handleDeactivate,
        handleReactivate,
        handleAnonymize,
    }
}
