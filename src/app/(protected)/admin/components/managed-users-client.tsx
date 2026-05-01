"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useManagedUsers } from "../hooks/use-managed-users"

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
    const {
        selectedUserIds,
        autoAdmin,
        isLoading,
        error,
        allSelected,
        setAutoAdmin,
        toggleUser,
        toggleAll,
        save,
    } = useManagedUsers({
        users,
        initialManagedUserIds,
        initialAutoAdmin,
        saveSuccessMessage: translations.saveSuccess,
        saveErrorMessage: translations.saveError,
    })

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

                <Button onClick={save} disabled={isLoading} className="w-full">
                    {isLoading ? translations.saving : translations.saveButton}
                </Button>
            </CardContent>
        </Card>
    )
}
