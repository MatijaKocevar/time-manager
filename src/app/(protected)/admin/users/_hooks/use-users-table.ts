"use client"

import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UserTableItem } from "../_schemas/user-table-schemas"
import { createUser } from "../_actions/user-actions"
import { exportUsersData } from "../_actions/export-actions"
import { useUserFormStore } from "../_stores/user-form-store"
import { downloadFile, base64ToBuffer, type ExportFormat } from "@/features/export"

interface UseUsersTableParams {
    users: UserTableItem[]
    errorMessage: string
}

export function useUsersTable({ users, errorMessage }: UseUsersTableParams) {
    const router = useRouter()
    const queryClient = useQueryClient()

    const searchQuery = useUserFormStore((s) => s.searchQuery)
    const showDeactivated = useUserFormStore((s) => s.showDeactivated)
    const isNewUserOpen = useUserFormStore((s) => s.isNewUserOpen)
    const isExporting = useUserFormStore((s) => s.isExporting)
    const createForm = useUserFormStore((s) => s.createForm)
    const setSearchQuery = useUserFormStore((s) => s.setSearchQuery)
    const setShowDeactivated = useUserFormStore((s) => s.setShowDeactivated)
    const setIsNewUserOpen = useUserFormStore((s) => s.setIsNewUserOpen)
    const setIsExporting = useUserFormStore((s) => s.setIsExporting)
    const setCreateFormData = useUserFormStore((s) => s.setCreateFormData)
    const resetCreateForm = useUserFormStore((s) => s.resetCreateForm)
    const setCreateLoading = useUserFormStore((s) => s.setCreateLoading)
    const setCreateError = useUserFormStore((s) => s.setCreateError)

    const filteredUsers = users.filter((user) => {
        const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesActiveFilter = showDeactivated || user.isActive
        return matchesSearch && matchesActiveFilter
    })

    function handleRowDoubleClick(userId: string) {
        router.push(`/admin/users/${userId}`)
    }

    const createUserMutation = useMutation({
        mutationFn: createUser,
        onMutate: () => {
            setCreateLoading(true)
            setCreateError("")
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] })
            setIsNewUserOpen(false)
            resetCreateForm()
            setCreateLoading(false)
        },
        onError: (error) => {
            setCreateError(error instanceof Error ? error.message : errorMessage)
            setCreateLoading(false)
        },
    })

    async function handleExportUsers(format: ExportFormat) {
        setIsExporting(true)
        try {
            const result = await exportUsersData({ format })
            if (result.error) {
                console.error("Export error:", result.error)
            } else if (result.data) {
                const extension = format === "excel" ? "xlsx" : format
                const filename = `users-export.${extension}`
                const fileData: string | Buffer =
                    format === "excel" && typeof result.data === "string"
                        ? base64ToBuffer(result.data)
                        : (result.data as string)
                downloadFile(fileData, filename, format)
            }
        } catch (error) {
            console.error("Export failed:", error)
        } finally {
            setIsExporting(false)
        }
    }

    return {
        searchQuery,
        showDeactivated,
        isNewUserOpen,
        isExporting,
        createForm,
        filteredUsers,
        setSearchQuery,
        setShowDeactivated,
        setIsNewUserOpen,
        resetCreateForm,
        setCreateFormData,
        handleRowDoubleClick,
        submitCreateUser: () => createUserMutation.mutate(createForm.data),
        handleExportUsers,
    }
}
