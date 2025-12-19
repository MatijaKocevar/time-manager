"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function updateSidebarState(open: boolean) {
    const session = await getServerSession(authConfig)

    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data: { sidebarOpen: open },
    })

    return { success: true }
}
