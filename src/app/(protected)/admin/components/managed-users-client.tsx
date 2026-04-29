"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { updateAdminManagedUsers, toggleAutoAdmin } from "../actions/admin-settings-actions"
import { useAdminSettingsStore } from "../stores/admin-settings-store"
import { adminSettingsKeys } from "../query-keys"

interface ManagedUser {
    id: string
    name: string | null
    email: string
}

interface ManagedUsersClientProps {
    initialManagedUserIds: string[]
    initialAutoAdmin: boolean
    users: ManagedUser[]
    translations: {
        title: string
        description: string
        emptyDescription: string
        autoAdminLabel: string
        autoAdminDescription: string
        selectAll: string
        deselectAll: string
        saveButton: string
        saving: string
        saveSuccess: string
        saveError: string
        noUsers: string
    }
}

export function ManagedUsersClient({
    initialManagedUserIds,
    initialAutoAdmin,
    users,
    translations,
}: ManagedUsersClientProps) {
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>(initialManagedUserIds)
    const [autoAdmin, setAutoAdmin] = useState(initialAutoAdmin)

    const setLoading = useAdminSettingsStore((state) => state.setLoading)
    const setError = useAdminSettingsStore((state) => state.setError)
    const isLoading = useAdminSettingsStore((state) => state.isLoading)
    const error = useAdminSettingsStore((state) => state.error)

    const queryClient = useQueryClient()

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
            toast.success(translations.saveSuccess)
            queryClient.invalidateQueries({ queryKey: adminSettingsKeys.all })
        },
        onError: (err: Error) => {
            setLoading(false)
            toast.error(err.message || translations.saveError)
            setError(err.message || translations.saveError)
        },
    })

    const allSelected = users.length > 0 && selectedUserIds.length === users.length

    function toggleUser(userId: string) {
        setSelectedUserIds((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        )
    }

    function toggleAll() {
        if (allSelected) {
            setSelectedUserIds([])
        } else {
            setSelectedUserIds(users.map((u) => u.id))
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{translations.title}</CardTitle>
                <CardDescription>
                    {selectedUserIds.length === 0
                        ? translations.emptyDescription
                        : translations.description}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Label htmlFor="auto-admin" className="text-sm font-medium">
                            {translations.autoAdminLabel}
                        </Label>
                        <p className="text-muted-foreground text-xs">
                            {translations.autoAdminDescription}
                        </p>
                    </div>
                    <Switch
                        id="auto-admin"
                        checked={autoAdmin}
                        onCheckedChange={(checked) => {
                            setAutoAdmin(checked)
                        }}
                    />
                </div>

                <Separator />

                {users.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{translations.noUsers}</p>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                                {selectedUserIds.length} / {users.length}
                            </span>
                            <Button variant="ghost" size="sm" onClick={toggleAll}>
                                {allSelected ? translations.deselectAll : translations.selectAll}
                            </Button>
                        </div>
                        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-accent"
                                    onClick={() => toggleUser(user.id)}
                                >
                                    <Checkbox
                                        id={`user-${user.id}`}
                                        checked={selectedUserIds.includes(user.id)}
                                        onCheckedChange={() => toggleUser(user.id)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="flex min-w-0 flex-col">
                                        <Label
                                            htmlFor={`user-${user.id}`}
                                            className="cursor-pointer truncate text-sm font-medium"
                                        >
                                            {user.name ?? user.email}
                                        </Label>
                                        {user.name && (
                                            <span className="text-muted-foreground truncate text-xs">
                                                {user.email}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {error && <p className="text-destructive text-sm">{error}</p>}

                <Button onClick={() => mutation.mutate()} disabled={isLoading} className="w-full">
                    {isLoading ? translations.saving : translations.saveButton}
                </Button>
            </CardContent>
        </Card>
    )
}
