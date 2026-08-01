"use client"

import { useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { updateAdminManagedUsers, toggleAutoAdmin } from "../_actions/admin-settings-actions"
import { useAdminSettingsStore } from "../_stores/admin-settings-store"
import { adminSettingsKeys } from "../query-keys"

interface ManagedUser {
    id: string
    name: string | null
    email: string
}

interface UseManagedUsersParams {
    users: ManagedUser[]
    initialManagedUserIds: string[]
    initialAutoAdmin: boolean
    saveSuccessMessage: string
    saveErrorMessage: string
}

export function useManagedUsers({
    users,
    initialManagedUserIds,
    initialAutoAdmin,
    saveSuccessMessage,
    saveErrorMessage,
}: UseManagedUsersParams) {
    const selectedUserIds = useAdminSettingsStore((s) => s.selectedUserIds)
    const autoAdmin = useAdminSettingsStore((s) => s.autoAdmin)
    const isLoading = useAdminSettingsStore((s) => s.isLoading)
    const error = useAdminSettingsStore((s) => s.error)
    const setSelectedUserIds = useAdminSettingsStore((s) => s.setSelectedUserIds)
    const setAutoAdmin = useAdminSettingsStore((s) => s.setAutoAdmin)
    const setLoading = useAdminSettingsStore((s) => s.setLoading)
    const setError = useAdminSettingsStore((s) => s.setError)

    const queryClient = useQueryClient()

    useEffect(() => {
        setSelectedUserIds(initialManagedUserIds)
        setAutoAdmin(initialAutoAdmin)
    }, [initialManagedUserIds, initialAutoAdmin, setSelectedUserIds, setAutoAdmin])

    const allSelected = users.length > 0 && selectedUserIds.length === users.length

    function toggleUser(userId: string) {
        setSelectedUserIds(
            selectedUserIds.includes(userId)
                ? selectedUserIds.filter((id) => id !== userId)
                : [...selectedUserIds, userId]
        )
    }

    function toggleAll() {
        setSelectedUserIds(allSelected ? [] : users.map((u) => u.id))
    }

    const mutation = useMutation({
        mutationFn: async () => {
            const [usersResult, autoAdminResult] = await Promise.all([
                updateAdminManagedUsers({ userIds: selectedUserIds }),
                toggleAutoAdmin({ enabled: autoAdmin }),
            ])
            if ("error" in usersResult) throw new Error(usersResult.error)
            if ("error" in autoAdminResult) throw new Error(autoAdminResult.error)
        },
        onMutate: () => {
            setLoading(true)
            setError(null)
        },
        onSuccess: () => {
            setLoading(false)
            toast.success(saveSuccessMessage)
            queryClient.invalidateQueries({ queryKey: adminSettingsKeys.all })
        },
        onError: (err: Error) => {
            setLoading(false)
            const message = err.message || saveErrorMessage
            toast.error(message)
            setError(message)
        },
    })

    return {
        selectedUserIds,
        autoAdmin,
        isLoading,
        error,
        allSelected,
        setAutoAdmin,
        toggleUser,
        toggleAll,
        save: () => mutation.mutate(),
    }
}
