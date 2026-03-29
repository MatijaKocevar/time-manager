"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function getUserLayoutData() {
    const session = await getServerSession(authConfig)

    if (!session?.user?.id) {
        return {
            defaultOpen: true,
            userTheme: "light",
            sidebarExpandedItems: [] as string[],
            hasUrnikCredentials: false,
        }
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            sidebarOpen: true,
            theme: true,
            sidebarExpandedItems: true,
            urnikUsername: true,
        },
    })

    return {
        defaultOpen: user?.sidebarOpen ?? true,
        userTheme: user?.theme ?? "light",
        sidebarExpandedItems: Array.isArray(user?.sidebarExpandedItems)
            ? (user.sidebarExpandedItems as string[])
            : [],
        hasUrnikCredentials: !!user?.urnikUsername,
    }
}

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

export async function updateSidebarExpandedItems(expandedItems: string[]) {
    const session = await getServerSession(authConfig)

    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data: { sidebarExpandedItems: expandedItems },
    })

    return { success: true }
}
