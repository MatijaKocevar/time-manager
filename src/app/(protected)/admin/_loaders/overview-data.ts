import { getLocale } from "next-intl/server"
import { getUsers } from "../users/_actions/user-actions"
import { getAllRequests } from "@/app/(protected)/requests/_actions/request-actions"
import { getHolidays } from "../holidays/_actions/holiday-actions"
import { prisma } from "@/lib/prisma"
import { getUpcomingHolidays } from "../_utils"
import type { Request, Holiday } from "../_schemas"

interface OverviewData {
    stats: {
        users: number
        pendingRequests: number
        upcomingHolidays: number
        lists: number
    }
    statusCounts: {
        PENDING: number
        APPROVED: number
        REJECTED: number
        CANCELLED: number
    }
    recentPendingRequests: Request[]
    upcomingHolidays: Holiday[]
    totalPending: number
    locale: string
}

export async function loadOverviewData(): Promise<OverviewData> {
    const [users, pendingRequests, allRequests, holidaysResult, taskLists, locale] =
        await Promise.all([
            getUsers(),
            getAllRequests(["PENDING"]),
            getAllRequests(),
            getHolidays(),
            prisma.list.count(),
            getLocale(),
        ])

    const holidays = (holidaysResult.success ? holidaysResult.data : []) ?? []

    const upcomingHolidays = getUpcomingHolidays(
        holidays.map((h: { id: string; name: string; date: string | Date }) => ({
            ...h,
            date: h.date instanceof Date ? h.date : new Date(h.date),
        }))
    )

    const recentPendingRequests: Request[] = pendingRequests.map(
        (r: {
            id: string
            type: string
            startDate: string | Date
            endDate: string | Date
            status: string
            user?: { name?: string | null; email?: string }
        }) => ({
            id: r.id,
            type: r.type,
            startDate: r.startDate instanceof Date ? r.startDate : new Date(r.startDate),
            endDate: r.endDate instanceof Date ? r.endDate : new Date(r.endDate),
            status: r.status,
            user: { name: r.user?.name ?? r.user?.email ?? "" },
        })
    )

    const approvedCount = allRequests.filter(
        (r: { status: string }) => r.status === "APPROVED"
    ).length
    const rejectedCount = allRequests.filter(
        (r: { status: string }) => r.status === "REJECTED"
    ).length
    const cancelledCount = allRequests.filter(
        (r: { status: string }) => r.status === "CANCELLED"
    ).length

    return {
        stats: {
            users: users.length,
            pendingRequests: pendingRequests.length,
            upcomingHolidays: upcomingHolidays.length,
            lists: taskLists,
        },
        statusCounts: {
            PENDING: pendingRequests.length,
            APPROVED: approvedCount,
            REJECTED: rejectedCount,
            CANCELLED: cancelledCount,
        },
        recentPendingRequests,
        upcomingHolidays,
        totalPending: pendingRequests.length,
        locale,
    }
}
