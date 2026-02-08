"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import type { HourType } from "@/../../prisma/generated/client"
import { calculateExpectedHoursToDate } from "@/lib/balance-helpers"

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
        const startOfYear = new Date(Date.UTC(year, 0, 1))
        const endOfYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))

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

export async function getYearlyBalance(input: GetYearlyCalendarDataInput) {
    const session = await requireAuth()

    const validation = GetYearlyCalendarDataSchema.safeParse(input)
    if (!validation.success) {
        return { error: validation.error.message }
    }

    const { year } = validation.data

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { workHoursPerDay: true },
        })

        const workHoursPerDay = user?.workHoursPerDay || 8

        const startOfYear = new Date(Date.UTC(year, 0, 1))
        const today = new Date()
        const endDate =
            year === today.getFullYear()
                ? new Date(
                      Date.UTC(
                          today.getFullYear(),
                          today.getMonth(),
                          today.getDate(),
                          23,
                          59,
                          59,
                          999
                      )
                  )
                : new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))

        const holidays = await prisma.holiday.findMany({
            where: {
                date: {
                    gte: startOfYear,
                    lte: endDate,
                },
            },
        })

        let yearlyBalance = 0
        const currentMonth = year === today.getFullYear() ? today.getMonth() : 11

        for (let month = 0; month <= currentMonth; month++) {
            const monthStart = new Date(Date.UTC(year, month, 1))
            const monthEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999))

            const monthSummaries = await prisma.dailyHourSummary.findMany({
                where: {
                    userId: session.user.id,
                    date: {
                        gte: monthStart,
                        lte: monthEnd,
                    },
                },
            })

            const monthTotalHours = monthSummaries.reduce((sum, s) => sum + Number(s.totalHours), 0)

            const monthStartLocal = new Date(year, month, 1)
            const monthEndLocal = new Date(year, month + 1, 0)

            const monthExpectedHours = calculateExpectedHoursToDate(
                monthStartLocal,
                monthEndLocal,
                holidays,
                workHoursPerDay
            )

            const monthBalance = monthTotalHours - monthExpectedHours
            yearlyBalance += monthBalance
        }

        return { data: yearlyBalance }
    } catch (error) {
        console.error("Error calculating yearly balance:", error)
        return { error: "Failed to calculate yearly balance" }
    }
}
