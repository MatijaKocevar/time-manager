"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

export async function getUserPreferences() {
    try {
        const session = await requireAuth()

        const preferences = await prisma.userPreferences.findUnique({
            where: { userId: session.user.id },
        })

        if (!preferences) {
            return {
                hoursViewMode: "weekly",
                hoursCardCollapsed: false,
                hoursExpandedRows: [],
            }
        }

        return {
            hoursViewMode: preferences.hoursViewMode,
            hoursCardCollapsed: preferences.hoursCardCollapsed,
            hoursExpandedRows: (preferences.hoursExpandedRows as string[]) || [],
        }
    } catch (_error) {
        throw new Error("Failed to fetch user preferences")
    }
}

export async function saveUserPreferences(input: {
    hoursViewMode?: string
    hoursCardCollapsed?: boolean
    hoursExpandedRows?: string[]
}) {
    try {
        const session = await requireAuth()

        await prisma.userPreferences.upsert({
            where: { userId: session.user.id },
            create: {
                userId: session.user.id,
                hoursViewMode: input.hoursViewMode || "weekly",
                hoursCardCollapsed: input.hoursCardCollapsed || false,
                hoursExpandedRows: input.hoursExpandedRows || [],
            },
            update: {
                ...(input.hoursViewMode !== undefined && { hoursViewMode: input.hoursViewMode }),
                ...(input.hoursCardCollapsed !== undefined && {
                    hoursCardCollapsed: input.hoursCardCollapsed,
                }),
                ...(input.hoursExpandedRows !== undefined && {
                    hoursExpandedRows: input.hoursExpandedRows,
                }),
            },
        })

        revalidatePath("/hours")
        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to save user preferences" }
    }
}
