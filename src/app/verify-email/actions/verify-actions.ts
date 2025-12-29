"use server"

import { prisma } from "@/lib/prisma"
import { VerifyEmailSchema } from "../schemas/verify-schemas"

export async function verifyEmail(token: string) {
    const validation = VerifyEmailSchema.safeParse({ token })

    if (!validation.success) {
        return { error: "Invalid verification token" }
    }

    const { token: validatedToken } = validation.data

    try {
        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token: validatedToken },
        })

        if (!verificationToken) {
            return { error: "Invalid or expired verification token" }
        }

        if (verificationToken.expires < new Date()) {
            await prisma.verificationToken.delete({
                where: { token: validatedToken },
            })
            return { error: "Verification token has expired" }
        }

        const user = await prisma.user.findUnique({
            where: { email: verificationToken.identifier },
        })

        if (!user) {
            return { error: "User not found" }
        }

        if (user.emailVerified) {
            await prisma.verificationToken.delete({
                where: { token: validatedToken },
            })
            return { error: "Email already verified" }
        }

        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { emailVerified: new Date() },
            }),
            prisma.verificationToken.delete({
                where: { token: validatedToken },
            }),
        ])

        return { success: true }
    } catch (error) {
        console.error("Email verification error:", error)
        return { error: "Failed to verify email. Please try again." }
    }
}
