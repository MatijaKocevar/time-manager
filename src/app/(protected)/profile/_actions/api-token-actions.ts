"use server"

import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { validateInput } from "@/lib/validation"
import { requireAuth, requireNotDemo } from "@/lib/auth-helpers"
import { generateApiToken, hashApiToken } from "@/lib/api-tokens"
import {
    CreateApiTokenSchema,
    RevokeApiTokenSchema,
    type CreateApiTokenInput,
    type RevokeApiTokenInput,
} from "../_schemas/api-token-schemas"

const MAX_TOKENS_PER_USER = 20
const DAY_MS = 24 * 60 * 60 * 1000

export async function getApiTokens() {
    try {
        const session = await requireAuth()

        return await prisma.apiToken.findMany({
            where: { userId: session.user.id },
            select: {
                id: true,
                name: true,
                lastUsedAt: true,
                expiresAt: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        })
    } catch (error) {
        if (error instanceof Error) {
            throw error
        }
        throw new Error("Failed to fetch API tokens")
    }
}

export async function createApiToken(input: CreateApiTokenInput) {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        return { error: "profile.validation.unauthorized" }
    }

    await requireNotDemo(session.user.id)

    const validation = validateInput(CreateApiTokenSchema, input)

    if (!validation.success) {
        return { error: validation.error }
    }

    try {
        const { name, expiresInDays } = validation.data

        const tokenCount = await prisma.apiToken.count({
            where: { userId: session.user.id },
        })

        if (tokenCount >= MAX_TOKENS_PER_USER) {
            return { error: "profile.apiTokens.errors.maxReached" }
        }

        const token = generateApiToken()

        const apiToken = await prisma.apiToken.create({
            data: {
                userId: session.user.id,
                name,
                tokenHash: hashApiToken(token),
                expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * DAY_MS) : null,
            },
            select: {
                id: true,
                name: true,
                lastUsedAt: true,
                expiresAt: true,
                createdAt: true,
            },
        })

        revalidatePath("/profile")
        return { success: true, token, apiToken }
    } catch (error) {
        console.error("Failed to create API token:", error)
        return { error: "profile.apiTokens.errors.createFailed" }
    }
}

export async function revokeApiToken(input: RevokeApiTokenInput) {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        return { error: "profile.validation.unauthorized" }
    }

    const validation = validateInput(RevokeApiTokenSchema, input)

    if (!validation.success) {
        return { error: validation.error }
    }

    try {
        const existing = await prisma.apiToken.findUnique({
            where: { id: validation.data.id },
        })

        if (!existing || existing.userId !== session.user.id) {
            return { error: "profile.apiTokens.errors.notFound" }
        }

        await prisma.apiToken.delete({
            where: { id: validation.data.id },
        })

        revalidatePath("/profile")
        return { success: true }
    } catch (error) {
        console.error("Failed to revoke API token:", error)
        return { error: "profile.apiTokens.errors.revokeFailed" }
    }
}
