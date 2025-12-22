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
    console.log("🔐 Registration attempt:", input)

    const validation = RegisterSchema.safeParse(input)

    if (!validation.success) {
        console.log("❌ Validation failed:", validation.error.issues)
        return { error: validation.error.issues[0].message }
    }

    const { name, email, password, locale } = validation.data
    console.log("✅ Validation passed for:", email, "locale:", locale)

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            console.log("❌ User already exists:", email)
            return { error: "User with this email already exists" }
        }

        console.log("🔑 Hashing password...")
        const hashedPassword = await bcrypt.hash(password, 12)

        console.log("👤 Creating user...")
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "USER",
                locale: locale || "en",
                emailVerified: null,
            },
        })
        console.log("✅ User created:", newUser.id)

        console.log("📋 Creating default list...")
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
        console.log("✅ Default list created")

        console.log("🎫 Creating verification token...")
        const token = await createVerificationToken(email)
        console.log("✅ Token created:", token.substring(0, 10) + "...")

        console.log("📧 Sending verification email...")
        const emailLocale = (locale || "en") as "en" | "sl"
        const emailHtml = verificationEmail(email, token, emailLocale)
        const emailSubject =
            emailLocale === "en"
                ? "Verify your email - Time Manager"
                : "Potrdite vaš email - Time Manager"

        const emailResult = await sendEmail(email, emailSubject, emailHtml)

        if (!emailResult.success) {
            console.error("❌ Failed to send verification email:", emailResult.error)
            return {
                error: "Account created but failed to send verification email. Please contact support.",
            }
        }

        console.log("✅ Verification email sent successfully")
        return { success: true }
    } catch (error) {
        console.error("💥 Registration error:", error)
        if (error instanceof Error) {
            console.error("Error message:", error.message)
            console.error("Error stack:", error.stack)
        }
        return { error: "Failed to create account. Please try again." }
    }
}
