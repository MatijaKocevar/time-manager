"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { EditUserDialog } from "./edit-user-dialog"
import { ChangePasswordDialog } from "./change-password-dialog"
import { DeleteUserDialog } from "./delete-user-dialog"
import type { UserRole } from "@/types"

interface User {
    id: string
    name: string | null
    email: string
    role: UserRole
    createdAt: Date
}

interface UsersTableProps {
    users: User[]
    currentUserId: string
}

export function UsersTable({ users, currentUserId }: UsersTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                                No users found
                            </TableCell>
                        </TableRow>
                    ) : (
                        users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    {user.name}
                                    {user.id === currentUserId && (
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            (You)
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                            user.role === "ADMIN"
                                                ? "bg-purple-100 text-purple-800"
                                                : "bg-blue-100 text-blue-800"
                                        }`}
                                    >
                                        {user.role}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <EditUserDialog user={user} />
                                        <ChangePasswordDialog
                                            userId={user.id}
                                            userName={user.name}
                                        />
                                        <DeleteUserDialog
                                            userId={user.id}
                                            userName={user.name}
                                            userEmail={user.email}
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
