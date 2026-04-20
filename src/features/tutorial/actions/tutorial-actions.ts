"use server"

import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function getTutorialsSeen(): Promise<string[]> {
    const session = await requireAuth()

    const rows = await prisma.tutorialSeen.findMany({
        where: { userId: session.user.id },
        select: { pageKey: true },
    })

    return rows.map((r) => r.pageKey)
}

export async function markTutorialSeen(pageKey: string): Promise<void> {
    const session = await requireAuth()

    await prisma.tutorialSeen.upsert({
        where: {
            userId_pageKey: {
                userId: session.user.id,
                pageKey,
            },
        },
        create: {
            userId: session.user.id,
            pageKey,
        },
        update: {},
    })
}
