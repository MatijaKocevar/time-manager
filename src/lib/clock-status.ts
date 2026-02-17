import { getTodayDayInfo } from "@/app/(protected)/clock/actions/clock-actions"
import type { DayInfo } from "@/app/(protected)/clock/schemas/day-info-schema"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"

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
                requestStart = new Date(request.startDate)
                requestStart.setHours(0, 0, 0, 0)
                requestEnd = new Date(request.endDate)
                requestEnd.setHours(23, 59, 59, 999)
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
