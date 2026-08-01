"use client"

import Link from "next/link"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Edit, Search, Plus, Download, MoreVertical } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import type { UserTableItem } from "../_schemas/user-table-schemas"
import { USER_ROLE_COLORS } from "../_constants/user-constants"
import { type UserRole } from "../_schemas/user-action-schemas"
import { useUsersTable } from "../_hooks/use-users-table"

interface UsersTableTranslations {
    filterPlaceholder: string
    showDeactivated: string
    createUser: string
    exportLabel: string
    name: string
    email: string
    role: string
    status: string
    created: string
    actions: string
    you: string
    roleLabels: Record<UserRole, string>
    statusActive: string
    statusInactive: string
    statusAnonymized: string
    noUsersMatch: string
    noUsers: string
    edit: string
    fillDetails: string
    nameLabel: string
    namePlaceholder: string
    emailLabel: string
    emailPlaceholder: string
    passwordLabel: string
    passwordPlaceholder: string
    roleLabel: string
    selectRole: string
    cancel: string
    saving: string
    save: string
    errorMessage: string
}

interface UsersTableClientProps {
    users: UserTableItem[]
    currentUserId: string
    translations: UsersTableTranslations
}

export function UsersTableClient({ users, currentUserId, translations }: UsersTableClientProps) {
    const {
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
        submitCreateUser,
        handleExportUsers,
    } = useUsersTable({ users, errorMessage: translations.errorMessage })

    return (
        <>
            <div id="users-toolbar" className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={translations.filterPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="showDeactivated"
                            checked={showDeactivated}
                            onCheckedChange={(checked) => setShowDeactivated(checked === true)}
                        />
                        <label
                            htmlFor="showDeactivated"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                            {translations.showDeactivated}
                        </label>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsNewUserOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            {translations.createUser}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleExportUsers("excel")}
                            disabled={isExporting}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            {translations.exportLabel}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div id="users-table" className="rounded-md border overflow-auto flex-1 min-h-0">
                <Table>
                    <TableHeader className="sticky top-0 z-30 bg-background">
                        <TableRow>
                            <TableHead className="sticky top-0 left-0 z-40 bg-background min-w-[150px] max-w-[200px] border-r">
                                {translations.name}
                            </TableHead>
                            <TableHead className="min-w-[200px]">{translations.email}</TableHead>
                            <TableHead className="min-w-[100px]">{translations.role}</TableHead>
                            <TableHead className="min-w-[100px]">{translations.status}</TableHead>
                            <TableHead className="min-w-[120px]">{translations.created}</TableHead>
                            <TableHead className="text-right min-w-[180px]">
                                {translations.actions}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center text-muted-foreground"
                                >
                                    {searchQuery ? translations.noUsersMatch : translations.noUsers}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow
                                    key={user.id}
                                    onDoubleClick={() => handleRowDoubleClick(user.id)}
                                    className={`cursor-pointer ${!user.isActive ? "opacity-60 bg-muted/50" : ""}`}
                                >
                                    <TableCell className="font-medium sticky left-0 z-10 bg-background min-w-[150px] max-w-[200px] border-r">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="cursor-default truncate">
                                                    {user.name}
                                                    {user.id === currentUserId && (
                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                            ({translations.you})
                                                        </span>
                                                    )}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <div className="text-sm">
                                                    {user.name}
                                                    {user.id === currentUserId && (
                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                            ({translations.you})
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
                                            {translations.roleLabels[user.role]}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
                                                user.anonymizedAt
                                                    ? "bg-gray-100 text-gray-800"
                                                    : user.isActive
                                                      ? "bg-green-100 text-green-800"
                                                      : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {user.anonymizedAt
                                                ? translations.statusAnonymized
                                                : user.isActive
                                                  ? translations.statusActive
                                                  : translations.statusInactive}
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
                                                {translations.edit}
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
                        <DialogTitle>{translations.createUser}</DialogTitle>
                        <DialogDescription>{translations.fillDetails}</DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            submitCreateUser()
                        }}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="name">{translations.nameLabel}</Label>
                            <Input
                                id="name"
                                value={createForm.data.name}
                                onChange={(e) => setCreateFormData({ name: e.target.value })}
                                placeholder={translations.namePlaceholder}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">{translations.emailLabel}</Label>
                            <Input
                                id="email"
                                type="email"
                                value={createForm.data.email}
                                onChange={(e) => setCreateFormData({ email: e.target.value })}
                                placeholder={translations.emailPlaceholder}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">{translations.passwordLabel}</Label>
                            <Input
                                id="password"
                                type="password"
                                value={createForm.data.password}
                                onChange={(e) => setCreateFormData({ password: e.target.value })}
                                placeholder={translations.passwordPlaceholder}
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">{translations.roleLabel}</Label>
                            <Select
                                value={createForm.data.role}
                                onValueChange={(value: UserRole) =>
                                    setCreateFormData({ role: value })
                                }
                            >
                                <SelectTrigger id="role">
                                    <SelectValue placeholder={translations.selectRole} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USER">
                                        {translations.roleLabels["USER"]}
                                    </SelectItem>
                                    <SelectItem value="ADMIN">
                                        {translations.roleLabels["ADMIN"]}
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
                                {translations.cancel}
                            </Button>
                            <Button type="submit" disabled={createForm.isLoading}>
                                {createForm.isLoading ? translations.saving : translations.save}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
