"use server"

import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth"
import {
    CreateHourEntrySchema,
    UpdateHourEntrySchema,
    DeleteHourEntrySchema,
    BulkCreateHourEntriesSchema,
    type CreateHourEntryInput,
    type UpdateHourEntryInput,
    type DeleteHourEntryInput,
    type BulkCreateHourEntriesInput,
} from "../schemas/hour-action-schemas"

async function requireAuth() {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
        throw new Error("Unauthorized")
    }
    return session
}

export async function createHourEntry(input: CreateHourEntryInput) {
    try {
        const session = await requireAuth()

        const validation = CreateHourEntrySchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const { date, hours, type, description } = validation.data

        await prisma.hourEntry.create({
            data: {
                userId: session.user.id,
                date,
                hours,
                type,
                description,
            },
        })

        revalidatePath("/hours")
        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to create hour entry" }
    }
}

export async function updateHourEntry(input: UpdateHourEntryInput) {
    try {
        const session = await requireAuth()

        const validation = UpdateHourEntrySchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const { id, date, hours, type, description } = validation.data

        const existing = await prisma.hourEntry.findUnique({
            where: { id },
        })

        if (!existing || existing.userId !== session.user.id) {
            return { error: "Hour entry not found" }
        }

        await prisma.hourEntry.update({
            where: { id },
            data: {
                date,
                hours,
                type,
                description,
            },
        })

        revalidatePath("/hours")
        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to update hour entry" }
    }
}

export async function deleteHourEntry(input: DeleteHourEntryInput) {
    try {
        const session = await requireAuth()

        const validation = DeleteHourEntrySchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const { id } = validation.data

        const existing = await prisma.hourEntry.findUnique({
            where: { id },
        })

        if (!existing || existing.userId !== session.user.id) {
            return { error: "Hour entry not found" }
        }

        await prisma.hourEntry.delete({
            where: { id },
        })

        revalidatePath("/hours")
        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to delete hour entry" }
    }
}

export async function bulkCreateHourEntries(input: BulkCreateHourEntriesInput) {
    try {
        const session = await requireAuth()

        const validation = BulkCreateHourEntriesSchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const { startDate, endDate, hours, type, description, skipWeekends } = validation.data

        if (startDate > endDate) {
            return { error: "Start date must be before end date" }
        }

        const entries = []
        const currentDate = new Date(startDate)

        while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay()
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

            if (!skipWeekends || !isWeekend) {
                const entryDate = new Date(currentDate)

                const existing = await prisma.hourEntry.findFirst({
                    where: {
                        userId: session.user.id,
                        date: entryDate,
                        type,
                    },
                })

                if (!existing) {
                    entries.push({
                        userId: session.user.id,
                        date: entryDate,
                        hours,
                        type,
                        description,
                    })
                }
            }

            currentDate.setDate(currentDate.getDate() + 1)
        }

        if (entries.length > 0) {
            await prisma.hourEntry.createMany({
                data: entries,
            })
        }

        revalidatePath("/hours")
        return { success: true, count: entries.length }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to create hour entries" }
    }
}

export async function getHourEntries(startDate?: string, endDate?: string, type?: string) {
    try {
        const session = await requireAuth()

        const parseDate = (dateStr: string) => {
            const [year, month, day] = dateStr.split("-").map(Number)
            return new Date(year, month - 1, day)
        }

        const entries = await prisma.hourEntry.findMany({
            where: {
                userId: session.user.id,
                ...(startDate && endDate
                    ? {
                          date: {
                              gte: parseDate(startDate),
                              lte: parseDate(endDate),
                          },
                      }
                    : {}),
                ...(type
                    ? {
                          type: type as
                              | "WORK"
                              | "VACATION"
                              | "SICK_LEAVE"
                              | "WORK_FROM_HOME"
                              | "OTHER",
                      }
                    : {}),
            },
            orderBy: {
                date: "desc",
            },
        })

        return entries
    } catch (error) {
        console.error("Error fetching hour entries:", error)
        throw new Error("Failed to fetch hour entries")
    }
}
