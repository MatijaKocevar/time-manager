"use server"

import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth"
import { requireNotDemo } from "@/lib/auth-helpers"
import { attemptUrnikNetLogin } from "@/app/(protected)/urnik-net-overview/requests/actions/urnik-net-requests-actions"
import {
    UpdateProfileSchema,
    type UpdateProfileInput,
    DeactivateAccountSchema,
    type DeactivateAccountInput,
    UpdateUrnikCredentialsSchema,
    type UpdateUrnikCredentialsInput,
    AutoCheckinPreferencesSchema,
    type AutoCheckinPreferencesInput,
} from "../schemas/profile-action-schemas"
import { BCRYPT_SALT_ROUNDS, WORK_HOURS_VALIDATION } from "../constants/profile-constants"

export async function getCurrentUser() {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        return null
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isDemo: true,
            workStartTime: true,
            workEndTime: true,
            workHoursPerDay: true,
            urnikUsername: true,
            urnikPassword: true,
            lastUrnikTestAt: true,
            workTimeAdjustments: {
                where: { date: today },
                take: 1,
            },
        },
    })

    return user
}

export async function updateProfile(input: UpdateProfileInput) {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        return { error: "profile.validation.unauthorized" }
    }

    const validation = UpdateProfileSchema.safeParse(input)

    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }

    const { name, currentPassword, newPassword, workStartTime, workEndTime } = validation.data

    let workHoursPerDay: number | undefined
    if (workStartTime && workEndTime) {
        const [startH, startM] = workStartTime.split(":").map(Number)
        const [endH, endM] = workEndTime.split(":").map(Number)
        workHoursPerDay = (endH * 60 + endM - startH * 60 - startM) / 60

        if (workHoursPerDay <= WORK_HOURS_VALIDATION.MIN_HOURS_PER_DAY) {
            return { error: "profile.validation.workEndTimeAfterStart" }
        }
    }

    if (newPassword && !currentPassword) {
        return { error: "profile.validation.currentPasswordRequired" }
    }

    let hashedPassword: string | undefined

    if (currentPassword && newPassword) {
        await requireNotDemo(session.user.id)

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        })

        if (!user?.password) {
            return { error: "profile.validation.userNotFound" }
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password)

        if (!isPasswordValid) {
            return { error: "profile.validation.currentPasswordIncorrect" }
        }

        hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS)
    }

    try {
        const updateData: {
            name: string
            password?: string
            workStartTime?: string
            workEndTime?: string
            workHoursPerDay?: number
        } = { name }

        if (hashedPassword !== undefined) updateData.password = hashedPassword
        if (workStartTime !== undefined) updateData.workStartTime = workStartTime
        if (workEndTime !== undefined) updateData.workEndTime = workEndTime
        if (workHoursPerDay !== undefined) updateData.workHoursPerDay = workHoursPerDay

        await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
        })

        if (workStartTime !== undefined || workEndTime !== undefined) {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            await prisma.workTimeAdjustment.deleteMany({
                where: { userId: session.user.id, date: today },
            })
        }

        revalidatePath("/profile")
        return { success: true }
    } catch (error) {
        console.error("Failed to update profile:", error)
        return { error: "profile.messages.updateFailed" }
    }
}

export async function deactivateAccount(input: DeactivateAccountInput) {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        return { error: "profile.validation.unauthorized" }
    }

    await requireNotDemo(session.user.id)

    const validation = DeactivateAccountSchema.safeParse(input)

    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }

    const { anonymize } = validation.data

    try {
        if (anonymize) {
            await prisma.user.update({
                where: { id: session.user.id },
                data: {
                    isActive: false,
                    deactivatedAt: new Date(),
                    anonymizedAt: new Date(),
                    name: `Anonymized User ${session.user.id.slice(-8)}`,
                    email: `anonymized-${session.user.id}@deleted.local`,
                    password: await bcrypt.hash(Math.random().toString(36), BCRYPT_SALT_ROUNDS),
                },
            })
        } else {
            await prisma.user.update({
                where: { id: session.user.id },
                data: {
                    isActive: false,
                    deactivatedAt: new Date(),
                },
            })
        }

        revalidatePath("/profile")
        return { success: true }
    } catch (error) {
        console.error("Failed to deactivate account:", error)
        return { error: "profile.deactivation.deactivationFailed" }
    }
}

export async function updateUrnikCredentials(input: UpdateUrnikCredentialsInput) {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        return { error: "profile.validation.unauthorized" }
    }

    await requireNotDemo(session.user.id)

    const validation = UpdateUrnikCredentialsSchema.safeParse(input)

    if (!validation.success) {
        return { error: validation.error.issues[0].message }
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

export async function getAutoCheckinPreferences() {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        return { error: "profile.validation.unauthorized" }
    }

    try {
        const [preferences, workDayRows] = await Promise.all([
            prisma.userPreferences.findUnique({
                where: { userId: session.user.id },
                select: {
                    autoCheckInEnabled: true,
                    autoCheckOutEnabled: true,
                },
            }),
            prisma.userWorkDay.findMany({
                where: { userId: session.user.id },
                select: { dayOfWeek: true },
            }),
        ])

        const resolvedPreferences =
            preferences ??
            (await prisma.userPreferences.create({
                data: {
                    userId: session.user.id,
                    autoCheckInEnabled: false,
                    autoCheckOutEnabled: false,
                },
                select: {
                    autoCheckInEnabled: true,
                    autoCheckOutEnabled: true,
                },
            }))

        const workDays =
            workDayRows.length > 0 ? workDayRows.map((r) => r.dayOfWeek) : [1, 2, 3, 4, 5]

        return { preferences: { ...resolvedPreferences, workDays }, success: true }
    } catch (error) {
        console.error("Failed to get auto check-in preferences:", error)
        return { error: "profile.autoCheckin.validation.fetchFailed" }
    }
}

export async function updateAutoCheckinPreferences(input: AutoCheckinPreferencesInput) {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        return { error: "profile.validation.unauthorized" }
    }

    await requireNotDemo(session.user.id)

    const validation = AutoCheckinPreferencesSchema.safeParse(input)
    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }

    const { autoCheckInEnabled, autoCheckOutEnabled, workDays } = validation.data

    try {
        await prisma.$transaction([
            prisma.userPreferences.upsert({
                where: { userId: session.user.id },
                create: { userId: session.user.id, autoCheckInEnabled, autoCheckOutEnabled },
                update: { autoCheckInEnabled, autoCheckOutEnabled },
            }),
            prisma.userWorkDay.deleteMany({ where: { userId: session.user.id } }),
            prisma.userWorkDay.createMany({
                data: workDays.map((dayOfWeek) => ({ userId: session.user.id, dayOfWeek })),
            }),
        ])

        revalidatePath("/profile")
        return { success: true }
    } catch (error) {
        console.error("Failed to update auto check-in preferences:", error)
        return { error: "profile.autoCheckin.validation.updateFailed" }
    }
}
