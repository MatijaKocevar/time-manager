"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-helpers"
import {
    UpdateManagedUsersSchema,
    ToggleAutoAdminSchema,
    type UpdateManagedUsersInput,
    type ToggleAutoAdminInput,
} from "../schemas/admin-settings-schemas"

export async function getAdminSettings() {
    const session = await requireAdmin()
    const adminId = session.user.id

    const admin = await prisma.user.findUnique({
        where: { id: adminId },
        select: {
            autoAdmin: true,
            managedUsers: {
                select: { userId: true },
            },
        },
    })

    return {
        autoAdmin: admin?.autoAdmin ?? false,
        managedUserIds: admin?.managedUsers.map((a) => a.userId) ?? [],
        currentAdminId: adminId,
    }
}

export async function updateAdminManagedUsers(input: UpdateManagedUsersInput) {
    const session = await requireAdmin()
    const adminId = session.user.id

    const validation = UpdateManagedUsersSchema.safeParse(input)
    if (!validation.success) {
        return { error: "Invalid input" }
    }

    const { userIds } = validation.data

    await prisma.$transaction(async (tx) => {
        await tx.adminUserAssignment.deleteMany({ where: { adminId } })

        if (userIds.length > 0) {
            await tx.adminUserAssignment.createMany({
                data: userIds.map((userId) => ({ adminId, userId })),
            })
        }
    })

    revalidatePath("/admin")
    return { success: true }
}

export async function toggleAutoAdmin(input: ToggleAutoAdminInput) {
    const session = await requireAdmin()
    const adminId = session.user.id

    const validation = ToggleAutoAdminSchema.safeParse(input)
    if (!validation.success) {
        return { error: "Invalid input" }
    }

    await prisma.user.update({
        where: { id: adminId },
        data: { autoAdmin: validation.data.enabled },
    })

    revalidatePath("/admin")
    return { success: true }
}
