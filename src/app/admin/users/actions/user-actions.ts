"use server"

import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth"
import { CreateUserSchema, type CreateUserInput } from "@/types"
import {
    UpdateUserSchema,
    DeleteUserSchema,
    ChangeUserPasswordSchema,
    type UpdateUserInput,
    type DeleteUserInput,
    type ChangeUserPasswordInput,
} from "../schemas/user-action-schemas"

async function requireAdmin() {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        throw new Error("Unauthorized")
    }

    if (session.user.role !== "ADMIN") {
        throw new Error("Admin access required")
    }

    return session
}

export async function getUsers() {
    await requireAdmin()

    const users = await prisma.user.findMany({
        orderBy: {
            createdAt: "desc",
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
    })

    return users
}

export async function createUser(input: CreateUserInput) {
    await requireAdmin()

    const validation = CreateUserSchema.safeParse(input)

    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }

    const { name, email, password, role } = validation.data

    const existingUser = await prisma.user.findUnique({
        where: { email },
    })

    if (existingUser) {
        return { error: "User with this email already exists" }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    try {
        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
            },
        })

        revalidatePath("/admin/users")
        return { success: true }
    } catch {
        return { error: "Failed to create user" }
    }
}

export async function updateUser(input: UpdateUserInput) {
    const session = await requireAdmin()

    const validation = UpdateUserSchema.safeParse(input)

    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }

    const { id, name, role } = validation.data

    if (id === session.user.id && role !== "ADMIN") {
        return { error: "Cannot remove your own admin privileges" }
    }

    try {
        await prisma.user.update({
            where: { id },
            data: { name, role },
        })

        revalidatePath("/admin/users")
        return { success: true }
    } catch {
        return { error: "Failed to update user" }
    }
}

export async function deleteUser(input: DeleteUserInput) {
    const session = await requireAdmin()

    const validation = DeleteUserSchema.safeParse(input)

    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }

    const { id } = validation.data

    if (id === session.user.id) {
        return { error: "Cannot delete your own account" }
    }

    const userToDelete = await prisma.user.findUnique({
        where: { id },
    })

    if (!userToDelete) {
        return { error: "User not found" }
    }

    if (userToDelete.role === "ADMIN") {
        const adminCount = await prisma.user.count({
            where: { role: "ADMIN" },
        })

        if (adminCount <= 1) {
            return { error: "Cannot delete the last admin user" }
        }
    }

    try {
        await prisma.user.delete({
            where: { id },
        })

        revalidatePath("/admin/users")
        return { success: true }
    } catch {
        return { error: "Failed to delete user" }
    }
}

export async function changeUserPassword(input: ChangeUserPasswordInput) {
    await requireAdmin()

    const validation = ChangeUserPasswordSchema.safeParse(input)

    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }

    const { id, newPassword } = validation.data

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    try {
        await prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        })

        revalidatePath("/admin/users")
        return { success: true }
    } catch {
        return { error: "Failed to change password" }
    }
}
