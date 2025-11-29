"use server"

import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth"
import { UpdateProfileSchema, type UpdateProfileInput } from "../schemas/profile-action-schemas"

export async function updateProfile(input: UpdateProfileInput) {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        return { error: "Unauthorized" }
    }

    const validation = UpdateProfileSchema.safeParse(input)

    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }

    const { name, currentPassword, newPassword } = validation.data

    if (newPassword && !currentPassword) {
        return { error: "Current password is required to set a new password" }
    }

    if (currentPassword && newPassword) {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        })

        if (!user?.password) {
            return { error: "User not found" }
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password)

        if (!isPasswordValid) {
            return { error: "Current password is incorrect" }
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12)

        try {
            await prisma.user.update({
                where: { id: session.user.id },
                data: { name, password: hashedPassword },
            })

            revalidatePath("/profile")
            return { success: true }
        } catch {
            return { error: "Failed to update profile" }
        }
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { name },
        })

        revalidatePath("/profile")
        return { success: true }
    } catch {
        return { error: "Failed to update profile" }
    }
}
