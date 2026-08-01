"use server"

import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth"
import { validateInput } from "@/lib/validation"
import { requireNotDemo } from "@/lib/auth-helpers"
import {
    AutoCheckinPreferencesSchema,
    type AutoCheckinPreferencesInput,
} from "../_schemas/profile-action-schemas"

export async function getAutoCheckinPreferences() {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        return { error: "profile.validation.unauthorized" }
    }

    try {
        const [preferences, workDayRows] = await Promise.all([
            prisma.userPreferences.findUnique({
                where: { userId: session.user.id },
                select: {
                    autoCheckInEnabled: true,
                    autoCheckOutEnabled: true,
                },
            }),
            prisma.userWorkDay.findMany({
                where: { userId: session.user.id },
                select: { dayOfWeek: true },
            }),
        ])

        const resolvedPreferences =
            preferences ??
            (await prisma.userPreferences.create({
                data: {
                    userId: session.user.id,
                    autoCheckInEnabled: false,
                    autoCheckOutEnabled: false,
                },
                select: {
                    autoCheckInEnabled: true,
                    autoCheckOutEnabled: true,
                },
            }))

        const workDays =
            workDayRows.length > 0 ? workDayRows.map((r) => r.dayOfWeek) : [1, 2, 3, 4, 5]

        return { preferences: { ...resolvedPreferences, workDays }, success: true }
    } catch (error) {
        console.error("Failed to get auto check-in preferences:", error)
        return { error: "profile.autoCheckin.validation.fetchFailed" }
    }
}

export async function updateAutoCheckinPreferences(input: AutoCheckinPreferencesInput) {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        return { error: "profile.validation.unauthorized" }
    }

    await requireNotDemo(session.user.id)

    const validation = validateInput(AutoCheckinPreferencesSchema, input)
    if (!validation.success) {
        return { error: validation.error }
    }

    const { autoCheckInEnabled, autoCheckOutEnabled, workDays } = validation.data

    try {
        await prisma.$transaction([
            prisma.userPreferences.upsert({
                where: { userId: session.user.id },
                create: { userId: session.user.id, autoCheckInEnabled, autoCheckOutEnabled },
                update: { autoCheckInEnabled, autoCheckOutEnabled },
            }),
            prisma.userWorkDay.deleteMany({ where: { userId: session.user.id } }),
            prisma.userWorkDay.createMany({
                data: workDays.map((dayOfWeek) => ({ userId: session.user.id, dayOfWeek })),
            }),
        ])

        revalidatePath("/profile")
        return { success: true }
    } catch (error) {
        console.error("Failed to update auto check-in preferences:", error)
        return { error: "profile.autoCheckin.validation.updateFailed" }
    }
}
