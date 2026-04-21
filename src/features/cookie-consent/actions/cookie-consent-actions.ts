"use server"

import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function getCookieConsent(): Promise<boolean | null> {
    try {
        const session = await requireAuth()
        const preferences = await prisma.userPreferences.findUnique({
            where: { userId: session.user.id },
            select: { cookieConsent: true },
        })
        return preferences?.cookieConsent ?? null
    } catch {
        return null
    }
}

export async function saveCookieConsent(accepted: boolean): Promise<void> {
    const session = await requireAuth()
    await prisma.userPreferences.upsert({
        where: { userId: session.user.id },
        create: { userId: session.user.id, cookieConsent: accepted },
        update: { cookieConsent: accepted },
    })
}
