"use server"

import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth"
import type { HourType } from "@/../../prisma/generated/client"
import { refreshDailyHourSummary } from "@/lib/materialized-views"
import { Prisma } from "../../../../../prisma/generated/client"
import {
    CreateHourEntrySchema,
    UpdateHourEntrySchema,
    DeleteHourEntrySchema,
    BulkCreateHourEntriesSchema,
    BatchUpdateHourEntriesSchema,
    type CreateHourEntryInput,
    type UpdateHourEntryInput,
    type DeleteHourEntryInput,
    type BulkCreateHourEntriesInput,
    type BatchUpdateHourEntriesInput,
} from "../schemas/hour-action-schemas"

async function requireAuth() {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
        throw new Error("Unauthorized")
    }
    return session
}

async function requireAdmin() {
    const session = await getServerSession(authConfig)
    if (!session?.user || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized - Admin access required")
    }
    return session
}

function formatLocalDateKey(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

export async function createHourEntry(input: CreateHourEntryInput) {
    try {
        const session = await requireAuth()

        const validation = CreateHourEntrySchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const { date, hours, type, description } = validation.data

        await prisma.$transaction(async (tx) => {
            const existing = await tx.hourEntry.findFirst({
                where: {
                    userId: session.user.id,
                    date,
                    type,
                    taskId: null,
                },
            })

            if (existing) {
                await tx.hourEntry.update({
                    where: { id: existing.id },
                    data: {
                        hours,
                        description,
                    },
                })
            } else {
                await tx.hourEntry.create({
                    data: {
                        userId: session.user.id,
                        date,
                        hours,
                        type,
                        description,
                    },
                })
            }
        })

        await refreshDailyHourSummary()
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

        await prisma.$transaction(async (tx) => {
            await tx.hourEntry.update({
                where: { id },
                data: {
                    date,
                    hours,
                    type,
                    description,
                },
            })
        })

        await refreshDailyHourSummary()
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

        await prisma.$transaction(async (tx) => {
            await tx.hourEntry.delete({
                where: { id },
            })
        })

        await refreshDailyHourSummary()
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

        const { startDate, endDate, hours, type, description, skipWeekends, skipHolidays } =
            validation.data

        if (startDate > endDate) {
            return { error: "Start date must be before end date" }
        }

        const holidays = skipHolidays
            ? await prisma.holiday.findMany({
                  where: {
                      date: {
                          gte: startDate,
                          lte: endDate,
                      },
                  },
              })
            : []

        const entriesToUpsert: Array<{
            date: Date
            hours: number
        }> = []
        const currentDate = new Date(startDate)

        while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay()
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
            const isHol =
                skipHolidays &&
                holidays.some((h) => {
                    const holidayDate = new Date(h.date)
                    holidayDate.setHours(0, 0, 0, 0)
                    const checkDate = new Date(currentDate)
                    checkDate.setHours(0, 0, 0, 0)
                    return holidayDate.getTime() === checkDate.getTime()
                })

            if ((!skipWeekends || !isWeekend) && !isHol) {
                entriesToUpsert.push({
                    date: new Date(currentDate),
                    hours,
                })
            }

            currentDate.setDate(currentDate.getDate() + 1)
        }

        if (entriesToUpsert.length > 0) {
            await prisma.$transaction(async (tx) => {
                for (const entry of entriesToUpsert) {
                    const existing = await tx.hourEntry.findFirst({
                        where: {
                            userId: session.user.id,
                            date: entry.date,
                            type,
                            taskId: null,
                        },
                    })

                    if (existing) {
                        await tx.hourEntry.update({
                            where: { id: existing.id },
                            data: {
                                hours: entry.hours,
                                description,
                            },
                        })
                    } else {
                        await tx.hourEntry.create({
                            data: {
                                userId: session.user.id,
                                date: entry.date,
                                hours: entry.hours,
                                type,
                                description,
                            },
                        })
                    }
                }
            })

            await refreshDailyHourSummary()
        }

        revalidatePath("/hours")
        return { success: true, count: entriesToUpsert.length }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to create hour entries" }
    }
}

export async function getHourEntriesForUser(
    userId: string,
    startDate?: string,
    endDate?: string,
    type?: string
) {
    try {
        await requireAdmin()

        const parseDate = (dateStr: string) => {
            const [year, month, day] = dateStr.split("-").map(Number)
            const date = new Date(Date.UTC(year, month - 1, day))
            return date
        }

        let summaryQuery = Prisma.sql`
            SELECT * FROM daily_hour_summary
            WHERE "userId" = ${userId}`

        if (startDate && endDate) {
            summaryQuery = Prisma.sql`${summaryQuery} AND date >= ${parseDate(startDate)}::timestamp AND date <= ${parseDate(endDate)}::timestamp`
        }
        if (type) {
            summaryQuery = Prisma.sql`${summaryQuery} AND type = ${type}::"HourType"`
        }

        summaryQuery = Prisma.sql`${summaryQuery} ORDER BY date DESC`

        const summariesRaw = (await prisma.$queryRaw(summaryQuery)) as Array<{
            id: string
            userId: string
            date: Date
            type: HourType
            manualHours: number
            trackedHours: number
            totalHours: number
            createdAt: Date
            updatedAt: Date
        }>

        const summaries = summariesRaw.map((s) => ({
            ...s,
            manualHours: Number(s.manualHours),
            trackedHours: Number(s.trackedHours),
            totalHours: Number(s.totalHours),
        }))

        const manualEntries = await prisma.hourEntry.findMany({
            where: {
                userId,
                taskId: null,
                ...(startDate && endDate
                    ? {
                          date: {
                              gte: parseDate(startDate),
                              lte: parseDate(endDate),
                          },
                      }
                    : {}),
                ...(type ? { type: type as HourType } : {}),
            },
            orderBy: {
                date: "desc",
            },
        })

        const manualEntriesByDateAndType = new Map<string, (typeof manualEntries)[0]>()
        for (const entry of manualEntries) {
            const key = `${formatLocalDateKey(entry.date)}-${entry.type}`
            manualEntriesByDateAndType.set(key, entry)
        }

        const grandTotalsMap = new Map<string, { date: Date; hours: number }>()
        for (const summary of summaries) {
            const dateKey = summary.date.toISOString()
            const existing = grandTotalsMap.get(dateKey)
            if (existing) {
                existing.hours += summary.totalHours
            } else {
                grandTotalsMap.set(dateKey, {
                    date: summary.date,
                    hours: summary.totalHours,
                })
            }
        }

        const grandTotalEntries = Array.from(grandTotalsMap.entries())
            .filter(([, data]) => data.hours > 0)
            .map(([dateKey, data]) => ({
                id: `grand-total-${dateKey}`,
                userId,
                date: data.date,
                hours: data.hours,
                type: "WORK" as const,
                description: null,
                taskId: "grand_total",
                createdAt: new Date(),
                updatedAt: new Date(),
            }))

        const entries = summaries.flatMap((summary) => {
            const baseDate = summary.date.toISOString()
            const result = []

            if (summary.totalHours > 0) {
                result.push({
                    id: `total-${summary.type}-${baseDate}`,
                    userId,
                    date: summary.date,
                    hours: summary.totalHours,
                    type: summary.type,
                    description: null,
                    taskId: "total",
                    createdAt: summary.createdAt,
                    updatedAt: summary.updatedAt,
                })
            }

            if (summary.trackedHours > 0) {
                result.push({
                    id: `tracked-${summary.type}-${baseDate}`,
                    userId,
                    date: summary.date,
                    hours: summary.trackedHours,
                    type: summary.type,
                    description: null,
                    taskId: "tracked",
                    createdAt: summary.createdAt,
                    updatedAt: summary.updatedAt,
                })
            }

            const summaryDateKey = formatLocalDateKey(summary.date)
            const manualKey = `${summaryDateKey}-${summary.type}`
            const manualEntry = manualEntriesByDateAndType.get(manualKey)

            if (manualEntry) {
                result.push({
                    id: manualEntry.id,
                    userId: manualEntry.userId,
                    date: manualEntry.date,
                    hours: manualEntry.hours,
                    type: manualEntry.type,
                    description: manualEntry.description,
                    taskId: manualEntry.taskId,
                    createdAt: manualEntry.createdAt,
                    updatedAt: manualEntry.updatedAt,
                })
            }

            return result
        })

        const allEntries = [...grandTotalEntries, ...entries]
        return allEntries.sort((a, b) => b.date.getTime() - a.date.getTime())
    } catch (error) {
        console.error("Error fetching hour entries:", error)
        throw new Error("Failed to fetch hour entries")
    }
}

export async function getHourEntries(startDate?: string, endDate?: string, type?: string) {
    try {
        const session = await requireAuth()

        const parseDate = (dateStr: string) => {
            const [year, month, day] = dateStr.split("-").map(Number)
            const date = new Date(year, month - 1, day)
            date.setHours(0, 0, 0, 0)
            return date
        }

        const parseEndDate = (dateStr: string) => {
            const [year, month, day] = dateStr.split("-").map(Number)
            const date = new Date(year, month - 1, day)
            date.setHours(0, 0, 0, 0)
            const nextDay = new Date(date)
            nextDay.setDate(nextDay.getDate() + 1)
            return nextDay
        }

        const whereClause = {
            userId: session.user.id,
            ...(startDate && endDate
                ? {
                      date: {
                          gte: parseDate(startDate),
                          lt: parseEndDate(endDate),
                      },
                  }
                : {}),
            ...(type ? { type: type as HourType } : {}),
        }

        let summaryQuery = Prisma.sql`
            SELECT * FROM daily_hour_summary
            WHERE "userId" = ${session.user.id}`

        if (startDate && endDate) {
            summaryQuery = Prisma.sql`${summaryQuery} AND date >= ${parseDate(startDate)}::timestamp AND date < ${parseEndDate(endDate)}::timestamp`
        }
        if (type) {
            summaryQuery = Prisma.sql`${summaryQuery} AND type = ${type}::"HourType"`
        }

        summaryQuery = Prisma.sql`${summaryQuery} ORDER BY date DESC`

        const summariesRaw = (await prisma.$queryRaw(summaryQuery)) as Array<{
            id: string
            userId: string
            date: Date
            type: HourType
            manualHours: number
            trackedHours: number
            totalHours: number
            createdAt: Date
            updatedAt: Date
        }>

        const summaries = summariesRaw.map((s) => ({
            ...s,
            manualHours: Number(s.manualHours),
            trackedHours: Number(s.trackedHours),
            totalHours: Number(s.totalHours),
        }))

        const manualEntries = await prisma.hourEntry.findMany({
            where: {
                userId: session.user.id,
                taskId: null,
                ...(startDate && endDate
                    ? {
                          date: {
                              gte: parseDate(startDate),
                              lt: parseEndDate(endDate),
                          },
                      }
                    : {}),
                ...(type ? { type: type as HourType } : {}),
            },
            orderBy: {
                date: "desc",
            },
        })

        const manualEntriesByDateAndType = new Map<string, (typeof manualEntries)[0]>()
        for (const entry of manualEntries) {
            const key = `${formatLocalDateKey(entry.date)}-${entry.type}`

            manualEntriesByDateAndType.set(key, entry)
        }

        const grandTotalsMap = new Map<string, { date: Date; hours: number }>()
        for (const summary of summaries) {
            const dateKey = formatLocalDateKey(summary.date)
            const existing = grandTotalsMap.get(dateKey)
            if (existing) {
                existing.hours += summary.totalHours
            } else {
                grandTotalsMap.set(dateKey, {
                    date: summary.date,
                    hours: summary.totalHours,
                })
            }
        }

        const grandTotalEntries = Array.from(grandTotalsMap.entries())
            .filter(([, data]) => data.hours > 0)
            .map(([dateKey, data]) => ({
                id: `grand-total-${dateKey}`,
                userId: session.user.id,
                date: data.date,
                hours: data.hours,
                type: "WORK" as const,
                description: null,
                taskId: "grand_total",
                createdAt: new Date(),
                updatedAt: new Date(),
            }))

        const entries = summaries.flatMap((summary) => {
            const baseDate = summary.date.toISOString()
            const result = []

            if (summary.totalHours > 0) {
                result.push({
                    id: `total-${summary.type}-${baseDate}`,
                    userId: session.user.id,
                    date: summary.date,
                    hours: summary.totalHours,
                    type: summary.type,
                    description: null,
                    taskId: "total",
                    createdAt: summary.createdAt,
                    updatedAt: summary.updatedAt,
                })
            }

            if (summary.trackedHours > 0) {
                result.push({
                    id: `tracked-${summary.type}-${baseDate}`,
                    userId: session.user.id,
                    date: summary.date,
                    hours: summary.trackedHours,
                    type: summary.type,
                    description: null,
                    taskId: "tracked",
                    createdAt: summary.createdAt,
                    updatedAt: summary.updatedAt,
                })
            }

            const summaryDateKey = formatLocalDateKey(summary.date)
            const manualKey = `${summaryDateKey}-${summary.type}`
            const manualEntry = manualEntriesByDateAndType.get(manualKey)

            if (manualEntry) {
                result.push({
                    id: manualEntry.id,
                    userId: manualEntry.userId,
                    date: manualEntry.date,
                    hours: manualEntry.hours,
                    type: manualEntry.type,
                    description: manualEntry.description,
                    taskId: manualEntry.taskId,
                    createdAt: manualEntry.createdAt,
                    updatedAt: manualEntry.updatedAt,
                })
            }

            return result
        })

        const allEntries = [...grandTotalEntries, ...entries]
        return allEntries.sort((a, b) => b.date.getTime() - a.date.getTime())
    } catch (error) {
        console.error("Error fetching hour entries:", error)
        throw new Error("Failed to fetch hour entries")
    }
}

export async function batchUpdateHourEntries(input: BatchUpdateHourEntriesInput) {
    try {
        const session = await requireAuth()

        const validation = BatchUpdateHourEntriesSchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const { changes } = validation.data

        const parseDateString = (dateStr: string): Date => {
            const [year, month, day] = dateStr.split("-").map(Number)
            return new Date(Date.UTC(year, month - 1, day))
        }

        await prisma.$transaction(async (tx) => {
            const affectedDates = new Set<string>()

            for (const change of changes) {
                affectedDates.add(`${change.date}-${change.type}`)

                if (change.action === "create") {
                    const existing = await tx.hourEntry.findFirst({
                        where: {
                            userId: session.user.id,
                            date: parseDateString(change.date),
                            type: change.type,
                            taskId: null,
                        },
                    })

                    if (existing) {
                        await tx.hourEntry.update({
                            where: { id: existing.id },
                            data: {
                                hours: change.hours,
                            },
                        })
                    } else {
                        await tx.hourEntry.create({
                            data: {
                                userId: session.user.id,
                                date: parseDateString(change.date),
                                hours: change.hours,
                                type: change.type,
                                description: null,
                            },
                        })
                    }
                } else if (change.action === "update" && change.entryId) {
                    const existingEntry = await tx.hourEntry.findUnique({
                        where: { id: change.entryId },
                    })

                    if (existingEntry) {
                        const existingDateKey = formatLocalDateKey(existingEntry.date)
                        if (existingDateKey !== change.date || existingEntry.type !== change.type) {
                            affectedDates.add(`${existingDateKey}-${existingEntry.type}`)
                        }

                        await tx.hourEntry.update({
                            where: { id: change.entryId },
                            data: {
                                date: parseDateString(change.date),
                                hours: change.hours,
                                type: change.type,
                            },
                        })
                    }
                } else if (change.action === "delete" && change.entryId) {
                    await tx.hourEntry.delete({
                        where: { id: change.entryId },
                    })
                }
            }
        })

        await refreshDailyHourSummary()
        revalidatePath("/hours")
        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to batch update hour entries" }
    }
}
