"use server"

import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { validateInput } from "@/lib/validation"
import { requireAdmin, requireNotDemo } from "@/lib/auth-helpers"
import {
    CreateUserSchema,
    UpdateUserSchema,
    DeleteUserSchema,
    ChangeUserPasswordSchema,
    DeactivateUserSchema,
    ReactivateUserSchema,
    AnonymizeUserSchema,
    type CreateUserInput,
    type UpdateUserInput,
    type DeleteUserInput,
    type ChangeUserPasswordInput,
    type DeactivateUserInput,
    type ReactivateUserInput,
    type AnonymizeUserInput,
} from "../_schemas/user-action-schemas"

export async function getUsers(includeDeactivated = false) {
    await requireAdmin()

    const users = await prisma.user.findMany({
        where: includeDeactivated ? undefined : { isActive: true },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            deactivatedAt: true,
            anonymizedAt: true,
            createdAt: true,
        },
    })

    return users
}

export async function getUserById(id: string) {
    await requireAdmin()

    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isDemo: true,
            isActive: true,
            deactivatedAt: true,
            anonymizedAt: true,
            workHoursPerDay: true,
        },
    })

    if (!user) {
        throw new Error("User not found")
    }

    return user
}

export async function createUser(input: CreateUserInput) {
    const session = await requireAdmin()

    const validation = validateInput(CreateUserSchema, input)

    if (!validation.success) {
        return { error: validation.error }
    }

    const { name, email, password, role } = validation.data

    if (role === "ADMIN") {
        await requireNotDemo(session.user.id)
    }

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
                emailVerified: new Date(),
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

    const validation = validateInput(UpdateUserSchema, input)

    if (!validation.success) {
        return { error: validation.error }
    }

    const { id, name, role } = validation.data

    if (id === session.user.id && role !== "ADMIN") {
        return { error: "Cannot remove your own admin privileges" }
    }

    if (role === "ADMIN") {
        await requireNotDemo(session.user.id)
    }

    await requireNotDemo(id)

    try {
        await prisma.user.update({
            where: { id },
            data: { name, role },
        })

        revalidatePath("/users")
        return { success: true }
    } catch {
        return { error: "Failed to update user" }
    }
}

export async function deleteUser(input: DeleteUserInput) {
    const session = await requireAdmin()

    const validation = validateInput(DeleteUserSchema, input)

    if (!validation.success) {
        return { error: validation.error }
    }

    const { id } = validation.data

    if (id === session.user.id) {
        return { error: "Cannot delete your own account" }
    }

    await requireNotDemo(session.user.id)
    await requireNotDemo(id)

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

        revalidatePath("/users")
        return { success: true }
    } catch {
        return { error: "Failed to delete user" }
    }
}

export async function changeUserPassword(input: ChangeUserPasswordInput) {
    const session = await requireAdmin()

    const validation = validateInput(ChangeUserPasswordSchema, input)

    if (!validation.success) {
        return { error: validation.error }
    }

    const { id, newPassword } = validation.data

    await requireNotDemo(session.user.id)
    await requireNotDemo(id)

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    try {
        await prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        })

        revalidatePath("/users")
        return { success: true }
    } catch {
        return { error: "Failed to change password" }
    }
}

export async function deactivateUser(input: DeactivateUserInput) {
    const session = await requireAdmin()

    const validation = validateInput(DeactivateUserSchema, input)

    if (!validation.success) {
        return { error: validation.error }
    }

    const { id } = validation.data

    if (id === session.user.id) {
        return { error: "Cannot deactivate your own account" }
    }

    await requireNotDemo(session.user.id)
    await requireNotDemo(id)

    const userToDeactivate = await prisma.user.findUnique({
        where: { id },
    })

    if (!userToDeactivate) {
        return { error: "User not found" }
    }

    if (!userToDeactivate.isActive) {
        return { error: "User is already deactivated" }
    }

    if (userToDeactivate.role === "ADMIN") {
        const activeAdminCount = await prisma.user.count({
            where: { role: "ADMIN", isActive: true },
        })

        if (activeAdminCount <= 1) {
            return { error: "Cannot deactivate the last active admin user" }
        }
    }

    try {
        await prisma.user.update({
            where: { id },
            data: {
                isActive: false,
                deactivatedAt: new Date(),
            },
        })

        revalidatePath("/admin/users")
        return { success: true }
    } catch {
        return { error: "Failed to deactivate user" }
    }
}

export async function reactivateUser(input: ReactivateUserInput) {
    await requireAdmin()

    const validation = validateInput(ReactivateUserSchema, input)

    if (!validation.success) {
        return { error: validation.error }
    }

    const { id } = validation.data

    const userToReactivate = await prisma.user.findUnique({
        where: { id },
    })

    if (!userToReactivate) {
        return { error: "User not found" }
    }

    if (userToReactivate.isActive) {
        return { error: "User is already active" }
    }

    if (userToReactivate.anonymizedAt) {
        return { error: "Cannot reactivate an anonymized user" }
    }

    try {
        await prisma.user.update({
            where: { id },
            data: {
                isActive: true,
                deactivatedAt: null,
            },
        })

        revalidatePath("/admin/users")
        return { success: true }
    } catch {
        return { error: "Failed to reactivate user" }
    }
}

export async function anonymizeUser(input: AnonymizeUserInput) {
    const session = await requireAdmin()

    const validation = validateInput(AnonymizeUserSchema, input)

    if (!validation.success) {
        return { error: validation.error }
    }

    const { id } = validation.data

    if (id === session.user.id) {
        return { error: "Cannot anonymize your own account" }
    }

    await requireNotDemo(session.user.id)
    await requireNotDemo(id)

    const userToAnonymize = await prisma.user.findUnique({
        where: { id },
    })

    if (!userToAnonymize) {
        return { error: "User not found" }
    }

    if (userToAnonymize.isActive) {
        return { error: "User must be deactivated before anonymization" }
    }

    if (userToAnonymize.anonymizedAt) {
        return { error: "User is already anonymized" }
    }

    if (userToAnonymize.role === "ADMIN") {
        const activeAdminCount = await prisma.user.count({
            where: { role: "ADMIN", isActive: true },
        })

        if (activeAdminCount === 0) {
            return { error: "Cannot anonymize the last admin user" }
        }
    }

    try {
        const timestamp = new Date().getTime()

        await prisma.user.update({
            where: { id },
            data: {
                name: `Anonymized User ${timestamp}`,
                email: `anonymized-${id}@deleted.local`,
                password: null,
                image: null,
                emailVerified: null,
                anonymizedAt: new Date(),
            },
        })

        revalidatePath("/admin/users")
        return { success: true }
    } catch {
        return { error: "Failed to anonymize user" }
    }
}
