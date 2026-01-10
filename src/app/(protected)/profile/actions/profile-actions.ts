"use server"

import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth"
import { UpdateProfileSchema, type UpdateProfileInput } from "../schemas/profile-action-schemas"
import { BCRYPT_SALT_ROUNDS, WORK_HOURS_VALIDATION } from "../constants/profile-constants"

export async function getCurrentUser() {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        return null
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            workStartTime: true,
            workEndTime: true,
            workHoursPerDay: true,
        },
    })

    return user
}

export async function updateProfile(input: UpdateProfileInput) {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        return { error: "profile.validation.unauthorized" }
    }

    const validation = UpdateProfileSchema.safeParse(input)

    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }

    const { name, currentPassword, newPassword, workStartTime, workEndTime } = validation.data

    let workHoursPerDay: number | undefined
    if (workStartTime && workEndTime) {
        const [startH, startM] = workStartTime.split(":").map(Number)
        const [endH, endM] = workEndTime.split(":").map(Number)
        workHoursPerDay = (endH * 60 + endM - startH * 60 - startM) / 60

        if (workHoursPerDay <= WORK_HOURS_VALIDATION.MIN_HOURS_PER_DAY) {
            return { error: "profile.validation.workEndTimeAfterStart" }
        }
    }

    if (newPassword && !currentPassword) {
        return { error: "profile.validation.currentPasswordRequired" }
    }

    if (currentPassword && newPassword) {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        })

        if (!user?.password) {
            return { error: "profile.validation.userNotFound" }
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password)

        if (!isPasswordValid) {
            return { error: "profile.validation.currentPasswordIncorrect" }
        }

        const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS)

        try {
            const updateData: {
                name: string
                password: string
                workStartTime?: string
                workEndTime?: string
                workHoursPerDay?: number
            } = { name, password: hashedPassword }

            if (workStartTime !== undefined) updateData.workStartTime = workStartTime
            if (workEndTime !== undefined) updateData.workEndTime = workEndTime
            if (workHoursPerDay !== undefined) updateData.workHoursPerDay = workHoursPerDay

            await prisma.user.update({
                where: { id: session.user.id },
                data: updateData,
            })

            revalidatePath("/profile")
            return { success: true }
        } catch (error) {
            console.error("Failed to update profile with password:", error)
            return { error: "profile.messages.updateFailed" }
        }
    }

    try {
        const updateData: {
            name: string
            workStartTime?: string
            workEndTime?: string
            workHoursPerDay?: number
        } = { name }

        if (workStartTime !== undefined) updateData.workStartTime = workStartTime
        if (workEndTime !== undefined) updateData.workEndTime = workEndTime
        if (workHoursPerDay !== undefined) updateData.workHoursPerDay = workHoursPerDay

        await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
        })

        revalidatePath("/profile")
        return { success: true }
    } catch (error) {
        console.error("Failed to update profile:", error)
        return { error: "profile.messages.updateFailed" }
    }
}
