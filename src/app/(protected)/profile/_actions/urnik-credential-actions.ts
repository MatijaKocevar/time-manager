"use server"

import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth"
import { validateInput } from "@/lib/validation"
import { requireNotDemo } from "@/lib/auth-helpers"
import { attemptUrnikNetLogin } from "@/app/(protected)/urnik-net-overview/requests/_actions/urnik-net-requests-actions"
import {
    UpdateUrnikCredentialsSchema,
    type UpdateUrnikCredentialsInput,
} from "../_schemas/profile-action-schemas"

export async function updateUrnikCredentials(input: UpdateUrnikCredentialsInput) {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        return { error: "profile.validation.unauthorized" }
    }

    await requireNotDemo(session.user.id)

    const validation = validateInput(UpdateUrnikCredentialsSchema, input)

    if (!validation.success) {
        return { error: validation.error }
    }

    try {
        if (input.clearCredentials) {
            await prisma.user.update({
                where: { id: session.user.id },
                data: {
                    urnikUsername: null,
                    urnikPassword: null,
                    lastUrnikTestAt: null,
                },
            })

            revalidatePath("/profile")
            revalidatePath("/urnik-net-overview/requests")
            return { success: true }
        }

        if (!input.username || !input.password) {
            return { error: "profile.urnikCredentials.validation.usernamePasswordRequired" }
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                urnikUsername: input.username,
                urnikPassword: input.password,
            },
        })

        revalidatePath("/profile")
        revalidatePath("/urnik-sync")
        return { success: true }
    } catch (error) {
        console.error("Failed to update urnik credentials:", error)
        return { error: "profile.urnikCredentials.validation.updateFailed" }
    }
}

export async function testUrnikConnection() {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        return { error: "profile.validation.unauthorized" }
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                urnikUsername: true,
                urnikPassword: true,
            },
        })

        if (!user?.urnikUsername || !user?.urnikPassword) {
            return { error: "profile.urnikCredentials.validation.noCredentialsSaved" }
        }

        const result = await attemptUrnikNetLogin()

        if (!result.success) {
            return { error: result.error || "profile.urnikCredentials.validation.connectionFailed" }
        }

        revalidatePath("/profile")
        revalidatePath("/clock/requests")
        return { success: true }
    } catch (error) {
        console.error("Failed to test urnik connection:", error)
        return {
            error:
                error instanceof Error
                    ? error.message
                    : "profile.urnikCredentials.validation.connectionFailed",
        }
    }
}

export async function clearUrnikCredentials() {
    return updateUrnikCredentials({ clearCredentials: true })
}
