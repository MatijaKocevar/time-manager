import { getTodayDayInfo } from "@/app/(protected)/urnik-net-overview/_actions/clock-actions"
import type { DayInfo } from "@/app/(protected)/urnik-net-overview/_schemas/day-info-schema"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay } from "@/lib/date-utils"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { fromZonedTime, toZonedTime } from "date-fns-tz"
import { APP_TIMEZONE } from "@/lib/utils"

const attendanceRefreshTtlMs = 5 * 60 * 1000
const lastAttendanceRefresh = new Map<string, number>()

export interface WorkWindow {
    start: Date
    end: Date | null
}

function isSameDayInTimeZone(date: Date, reference: Date, timeZone: string): boolean {
    const inZone = toZonedTime(date, timeZone)
    const referenceInZone = toZonedTime(reference, timeZone)

    return (
        inZone.getFullYear() === referenceInZone.getFullYear() &&
        inZone.getMonth() === referenceInZone.getMonth() &&
        inZone.getDate() === referenceInZone.getDate()
    )
}

function parseUrnikTime(value: string | null, timeZone: string): Date | null {
    if (!value) {
        return null
    }

    const match = value.match(/(\d{1,2}):(\d{2})/)
    if (!match) {
        return null
    }

    const hours = Number(match[1])
    const minutes = Number(match[2])
    const nowInZone = toZonedTime(new Date(), timeZone)

    const wallTime = new Date(
        nowInZone.getFullYear(),
        nowInZone.getMonth(),
        nowInZone.getDate(),
        hours,
        minutes,
        0,
        0
    )

    return fromZonedTime(wallTime, timeZone)
}

function getWindowFromState(
    state: { clockedInAt: Date | null; clockedOutAt: Date | null } | null,
    timeZone: string
): WorkWindow | null {
    if (!state?.clockedInAt) {
        return null
    }

    const start = state.clockedInAt
    const end = state.clockedOutAt && state.clockedOutAt > start ? state.clockedOutAt : null

    if (isSameDayInTimeZone(start, new Date(), timeZone)) {
        return { start, end }
    }

    const overnight = end === null && Date.now() - start.getTime() < 20 * 60 * 60 * 1000

    return overnight ? { start, end: null } : null
}

export async function getTodayWorkWindow(): Promise<WorkWindow | null> {
    try {
        const session = await getServerSession(authConfig)

        if (!session?.user) {
            return null
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { timeZone: true, urnikUsername: true },
        })

        const timeZone = user?.timeZone || APP_TIMEZONE
        const state = await prisma.autoClockState.findUnique({
            where: { userId: session.user.id },
        })

        const localWindow = getWindowFromState(state, timeZone)

        if (localWindow || !user?.urnikUsername) {
            return localWindow
        }

        const lastRefresh = lastAttendanceRefresh.get(session.user.id) ?? 0

        if (Date.now() - lastRefresh < attendanceRefreshTtlMs) {
            return null
        }

        lastAttendanceRefresh.set(session.user.id, Date.now())

        const result = await getTodayDayInfo()

        if (!result.success || !result.data) {
            return null
        }

        const start = parseUrnikTime(result.data.arrival, timeZone)

        if (!start) {
            return null
        }

        const departure = parseUrnikTime(result.data.departure, timeZone)
        const end = departure && departure > start ? departure : null

        await prisma.autoClockState.upsert({
            where: { userId: session.user.id },
            create: { userId: session.user.id, clockedInAt: start, clockedOutAt: end },
            update: { clockedInAt: start, clockedOutAt: end },
        })

        return { start, end }
    } catch (error) {
        console.error("Error getting today work window:", error)
        return null
    }
}

export async function hasLoggedArrivalToday(): Promise<boolean> {
    const result = await getTodayDayInfo()
    return result.success && result.data ? result.data.hasArrival : false
}

export async function hasLoggedLeaveToday(): Promise<boolean> {
    const result = await getTodayDayInfo()
    return result.success && result.data ? result.data.hasDeparture : false
}

export async function getArrivalLeaveStatus(): Promise<{
    success: boolean
    data?: DayInfo
    error?: string
    structureValid?: boolean
}> {
    return await getTodayDayInfo()
}

export async function getTodayWorkFromHomeStatus(): Promise<{
    hasApprovedWFH: boolean
    location: string | null
}> {
    try {
        const session = await getServerSession(authConfig)

        if (!session?.user) {
            return { hasApprovedWFH: false, location: null }
        }

        const now = new Date()

        const approvedWFHRequests = await prisma.request.findMany({
            where: {
                userId: session.user.id,
                status: "APPROVED",
                affectsHourType: true,
                cancelledAt: null,
                type: "WORK_FROM_HOME",
            },
            orderBy: {
                approvedAt: "desc",
            },
        })

        for (const request of approvedWFHRequests) {
            let requestStart: Date
            let requestEnd: Date

            if (request.isFullDay || !request.startTime || !request.endTime) {
                requestStart = startOfDay(new Date(request.startDate))
                requestEnd = endOfDay(new Date(request.endDate))
            } else {
                const [startHour, startMin] = request.startTime.split(":").map(Number)
                const [endHour, endMin] = request.endTime.split(":").map(Number)
                requestStart = new Date(request.startDate)
                requestStart.setHours(startHour, startMin, 0, 0)
                requestEnd = new Date(request.endDate)
                requestEnd.setHours(endHour, endMin, 0, 0)
            }

            if (now >= requestStart && now <= requestEnd) {
                return {
                    hasApprovedWFH: true,
                    location: request.location,
                }
            }
        }

        return { hasApprovedWFH: false, location: null }
    } catch (error) {
        console.error("Error checking WFH status:", error)
        return { hasApprovedWFH: false, location: null }
    }
}
