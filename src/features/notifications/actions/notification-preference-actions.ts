"use server"

import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { validateInput } from "@/lib/validation"
import { UpdateNotificationPreferencesSchema } from "../schemas/notification-schemas"
import type { UpdateNotificationPreferencesInput } from "../schemas/notification-schemas"

export async function getNotificationPreferences() {
    const session = await requireAuth()

    try {
        let preferences = await prisma.notificationPreference.findUnique({
            where: { userId: session.user.id },
        })

        if (!preferences) {
            preferences = await prisma.notificationPreference.create({
                data: { userId: session.user.id },
            })
        }

        return { preferences }
    } catch (error) {
        console.error("Error fetching notification preferences:", error)
        return { error: "Failed to fetch preferences" }
    }
}

export async function updateNotificationPreferences(input: UpdateNotificationPreferencesInput) {
    const session = await requireAuth()

    const validation = validateInput(UpdateNotificationPreferencesSchema, input)
    if (!validation.success) {
        return { error: validation.error }
    }

    try {
        const preferences = await prisma.notificationPreference.upsert({
            where: { userId: session.user.id },
            update: validation.data,
            create: {
                userId: session.user.id,
                ...validation.data,
            },
        })

        return { success: true, preferences }
    } catch (error) {
        console.error("Error updating notification preferences:", error)
        return { error: "Failed to update preferences" }
    }
}
