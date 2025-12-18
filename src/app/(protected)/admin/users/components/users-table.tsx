"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslations } from "next-intl"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, Search, Plus } from "lucide-react"
import type { UserTableItem } from "../schemas/user-table-schemas"
import { USER_ROLE_COLORS } from "../constants/user-constants"
import { getUserRoleTranslationKey } from "../utils/translation-helpers"

interface UsersTableProps {
    users: UserTableItem[]
    currentUserId: string
}

export function UsersTableWrapper({ users, currentUserId }: UsersTableProps) {
    const router = useRouter()
    const t = useTranslations("admin.users.table")
    const tRoles = useTranslations("admin.users.roles")
    const tCommon = useTranslations("common.actions")
    const [searchQuery, setSearchQuery] = useState("")

    const filteredUsers = users.filter((user) =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleRowDoubleClick = (userId: string) => {
        router.push(`/admin/users/${userId}`)
    }

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
                <Button asChild>
                    <Link href="/admin/users/create">
                        <Plus className="h-4 w-4 mr-2" />
                        {tCommon("create")} {t("name")}
                    </Link>
                </Button>
            </div>
            <div className="rounded-md border overflow-auto flex-1 min-h-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[150px]">{t("name")}</TableHead>
                            <TableHead className="min-w-[200px]">{t("email")}</TableHead>
                            <TableHead className="min-w-[100px]">{t("role")}</TableHead>
                            <TableHead className="min-w-[120px]">{t("created")}</TableHead>
                            <TableHead className="text-right min-w-[180px]">{t("actions")}</TableHead>
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
                                    <TableCell className="font-medium">
                                        {user.name}
                                        {user.id === currentUserId && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                ({t("you")})
                                            </span>
                                        )}
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
        </>
    )
}
