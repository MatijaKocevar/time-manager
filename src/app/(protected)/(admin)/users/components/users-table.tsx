"use client"

import Link from "next/link"
import { useState } from "react"
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

interface UsersTableProps {
    users: UserTableItem[]
    currentUserId: string
}

export function UsersTableWrapper({ users, currentUserId }: UsersTableProps) {
    const [searchQuery, setSearchQuery] = useState("")

    const filteredUsers = users.filter((user) =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <>
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Filter by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button asChild>
                    <Link href="/users/create">
                        <Plus className="h-4 w-4 mr-2" />
                        Create User
                    </Link>
                </Button>
            </div>
            <div className="rounded-md border overflow-auto flex-1 min-h-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[150px]">Name</TableHead>
                            <TableHead className="min-w-[200px]">Email</TableHead>
                            <TableHead className="min-w-[100px]">Role</TableHead>
                            <TableHead className="min-w-[120px]">Created</TableHead>
                            <TableHead className="text-right min-w-[180px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-center text-muted-foreground"
                                >
                                    {searchQuery ? "No users match your search" : "No users found"}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
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
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
                                                user.role === "ADMIN"
                                                    ? "bg-purple-100 text-purple-800"
                                                    : "bg-blue-100 text-blue-800"
                                            }`}
                                        >
                                            {user.role}
                                        </span>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/users/${user.id}`}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
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
