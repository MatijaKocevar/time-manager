"use server"

import bcrypt from "bcryptjs"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { RegisterSchema } from "../schemas/register-schemas"
import { sendEmail } from "@/lib/notifications/email"
import { verificationEmail } from "@/lib/notifications/email-templates"

function generateVerificationToken(): string {
    return crypto.randomBytes(32).toString("hex")
}

async function createVerificationToken(email: string, expiryHours: number = 24) {
    const token = generateVerificationToken()
    const expires = new Date(Date.now() + expiryHours * 60 * 60 * 1000)

    const existingToken = await prisma.verificationToken.findFirst({
        where: { identifier: email },
    })

    if (existingToken) {
        await prisma.verificationToken.delete({
            where: {
                identifier_token: {
                    identifier: email,
                    token: existingToken.token,
                },
            },
        })
    }

    await prisma.verificationToken.create({
        data: {
            identifier: email,
            token,
            expires,
        },
    })

    return token
}

export async function registerUser(input: unknown) {
    const validation = RegisterSchema.safeParse(input)

    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }

    const { name, email, password } = validation.data

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return { error: "User with this email already exists" }
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "USER",
                emailVerified: null,
            },
        })

        await prisma.list.create({
            data: {
                userId: newUser.id,
                name: "No List",
                description: "Tasks without a specific list",
                color: "#6b7280",
                isDefault: true,
                order: 0,
            },
        })

        const token = await createVerificationToken(email)

        const locale = "en"
        const emailHtml = verificationEmail(email, token, locale)
        const emailSubject =
            locale === "en"
                ? "Verify your email - Time Manager"
                : "Potrdite vaš email - Time Manager"

        const emailResult = await sendEmail(email, emailSubject, emailHtml)

        if (!emailResult.success) {
            console.error("Failed to send verification email:", emailResult.error)
            return {
                error: "Account created but failed to send verification email. Please contact support.",
            }
        }

        return { success: true }
    } catch (error) {
        console.error("Registration error:", error)
        return { error: "Failed to create account. Please try again." }
    }
}
