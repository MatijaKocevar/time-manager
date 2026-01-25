"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import type { HourType } from "@/../../prisma/generated/client"

const GetYearlyCalendarDataSchema = z.object({
    year: z.number().int().min(2020).max(2050),
})

type GetYearlyCalendarDataInput = z.infer<typeof GetYearlyCalendarDataSchema>

async function requireAuth() {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
        throw new Error("Unauthorized")
    }
    return session
}

export interface DayData {
    types: Partial<Record<HourType, number>>
    totalHours: number
}

export type YearlyCalendarData = Map<string, DayData>

export async function getYearlyCalendarData(input: GetYearlyCalendarDataInput) {
    const session = await requireAuth()

    const validation = GetYearlyCalendarDataSchema.safeParse(input)
    if (!validation.success) {
        return { error: validation.error.message }
    }

    const { year } = validation.data

    try {
        const startOfYear = new Date(year, 0, 1)
        const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999)

        const summariesRaw = await prisma.dailyHourSummary.findMany({
            where: {
                userId: session.user.id,
                date: {
                    gte: startOfYear,
                    lte: endOfYear,
                },
            },
            orderBy: { date: "asc" },
        })

        const dataMap = new Map<string, DayData>()

        summariesRaw.forEach((summary) => {
            const date = summary.date
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

            const totalHours = Number(summary.totalHours)

            if (!dataMap.has(dateKey)) {
                dataMap.set(dateKey, {
                    types: {},
                    totalHours: 0,
                })
            }

            const dayData = dataMap.get(dateKey)!
            dayData.types[summary.type] = totalHours
            dayData.totalHours += totalHours
        })

        const result: Record<string, DayData> = {}
        dataMap.forEach((value, key) => {
            result[key] = value
        })

        return { data: result }
    } catch (error) {
        console.error("Error fetching yearly calendar data:", error)
        return { error: "Failed to fetch yearly calendar data" }
    }
}
