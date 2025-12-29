"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function updateThemePreference(theme: "light" | "dark") {
    const session = await getServerSession(authConfig)

    if (!session?.user?.id) {
        return { success: false }
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { theme },
        })

        return { success: true }
    } catch (error) {
        return { success: false }
    }
}
