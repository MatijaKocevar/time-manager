"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Edit, Search, Plus } from "lucide-react"
import type { UserTableItem } from "../schemas/user-table-schemas"
import { USER_ROLE_COLORS } from "../constants/user-constants"
import { getUserRoleTranslationKey } from "../utils/translation-helpers"
import { createUser } from "../actions/user-actions"
import { useUserFormStore } from "../stores/user-form-store"
import { type UserRole } from "../schemas/user-action-schemas"

interface UsersTableProps {
    users: UserTableItem[]
    currentUserId: string
}

export function UsersTableWrapper({ users, currentUserId }: UsersTableProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const t = useTranslations("admin.users.table")
    const tRoles = useTranslations("admin.users.roles")
    const tUsers = useTranslations("admin.users")
    const tForm = useTranslations("admin.users.form")
    const tCommon = useTranslations("common.actions")
    const [searchQuery, setSearchQuery] = useState("")
    const [isNewUserOpen, setIsNewUserOpen] = useState(false)

    const { createForm, setCreateFormData, resetCreateForm, setCreateLoading, setCreateError } =
        useUserFormStore()

    const filteredUsers = users.filter((user) =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleRowDoubleClick = (userId: string) => {
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
            setCreateError(error instanceof Error ? error.message : tCommon("error"))
            setCreateLoading(false)
        },
    })

    return (
        <>
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={t("filterPlaceholder")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button onClick={() => setIsNewUserOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {tUsers("createUser")}
                </Button>
            </div>
            <div className="rounded-md border overflow-auto flex-1 min-h-0">
                <Table>
                    <TableHeader className="sticky top-0 z-30 bg-background">
                        <TableRow>
                            <TableHead className="sticky top-0 left-0 z-40 bg-background min-w-[150px] max-w-[200px] border-r">
                                {t("name")}
                            </TableHead>
                            <TableHead className="min-w-[200px]">{t("email")}</TableHead>
                            <TableHead className="min-w-[100px]">{t("role")}</TableHead>
                            <TableHead className="min-w-[120px]">{t("created")}</TableHead>
                            <TableHead className="text-right min-w-[180px]">
                                {t("actions")}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-center text-muted-foreground"
                                >
                                    {searchQuery ? t("noUsersMatch") : t("noUsers")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow
                                    key={user.id}
                                    onDoubleClick={() => handleRowDoubleClick(user.id)}
                                    className="cursor-pointer"
                                >
                                    <TableCell className="font-medium sticky left-0 z-10 bg-background min-w-[150px] max-w-[200px] border-r">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="cursor-default truncate">
                                                    {user.name}
                                                    {user.id === currentUserId && (
                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                            ({t("you")})
                                                        </span>
                                                    )}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <div className="text-sm">
                                                    {user.name}
                                                    {user.id === currentUserId && (
                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                            ({t("you")})
                                                        </span>
                                                    )}
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${USER_ROLE_COLORS[user.role]}`}
                                        >
                                            {tRoles(getUserRoleTranslationKey(user.role))}
                                        </span>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/admin/users/${user.id}`}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                {t("edit")}
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isNewUserOpen} onOpenChange={setIsNewUserOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{tUsers("createUser")}</DialogTitle>
                        <DialogDescription>{tForm("fillDetails")}</DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            createUserMutation.mutate(createForm.data)
                        }}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="name">{tForm("name")}</Label>
                            <Input
                                id="name"
                                value={createForm.data.name}
                                onChange={(e) => setCreateFormData({ name: e.target.value })}
                                placeholder={tForm("namePlaceholder")}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">{tForm("email")}</Label>
                            <Input
                                id="email"
                                type="email"
                                value={createForm.data.email}
                                onChange={(e) => setCreateFormData({ email: e.target.value })}
                                placeholder={tForm("emailPlaceholder")}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">{tForm("password")}</Label>
                            <Input
                                id="password"
                                type="password"
                                value={createForm.data.password}
                                onChange={(e) => setCreateFormData({ password: e.target.value })}
                                placeholder={tForm("passwordPlaceholder")}
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">{tForm("role")}</Label>
                            <Select
                                value={createForm.data.role}
                                onValueChange={(value: UserRole) =>
                                    setCreateFormData({ role: value })
                                }
                            >
                                <SelectTrigger id="role">
                                    <SelectValue placeholder={tForm("selectRole")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USER">
                                        {tRoles(getUserRoleTranslationKey("USER"))}
                                    </SelectItem>
                                    <SelectItem value="ADMIN">
                                        {tRoles(getUserRoleTranslationKey("ADMIN"))}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {createForm.error && (
                            <p className="text-sm text-destructive">{createForm.error}</p>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsNewUserOpen(false)
                                    resetCreateForm()
                                }}
                            >
                                {tCommon("cancel")}
                            </Button>
                            <Button type="submit" disabled={createForm.isLoading}>
                                {createForm.isLoading ? tCommon("saving") : tCommon("save")}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
