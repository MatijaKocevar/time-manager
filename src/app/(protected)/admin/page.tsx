import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authConfig } from "@/lib/auth"
import { getTranslations, getLocale } from "next-intl/server"
import { getUsers } from "./users/actions/user-actions"
import { getAllRequests } from "../requests/actions/request-actions"
import { getHolidays } from "./holidays/actions/holiday-actions"
import { prisma } from "@/lib/prisma"
import { StatsCards } from "./components/stats-cards"
import { RequestStatusBreakdown } from "./components/request-status-breakdown"
import { QuickActions } from "./components/quick-actions"
import { RecentPendingRequests } from "./components/recent-pending-requests"
import { UpcomingHolidays } from "./components/upcoming-holidays"
import { getUpcomingHolidays } from "./utils"
import type { Request } from "./types"

export default async function AdminOverviewPage() {
    const session = await getServerSession(authConfig)

    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/")
    }

    const locale = await getLocale()
    const tAdmin = await getTranslations("admin.overview")
    const tRequests = await getTranslations("requests.statuses")

    const [users, pendingRequests, allRequests, holidaysResult, taskLists] = await Promise.all([
        getUsers(),
        getAllRequests(["PENDING"]),
        getAllRequests(),
        getHolidays(),
        prisma.list.count(),
    ])

    const holidays = (holidaysResult.success ? holidaysResult.data : []) ?? []
    const approvedRequests = allRequests.filter((r: { status: string }) => r.status === "APPROVED")
    const rejectedRequests = allRequests.filter((r: { status: string }) => r.status === "REJECTED")
    const cancelledRequests = allRequests.filter(
        (r: { status: string }) => r.status === "CANCELLED"
    )

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

    const stats = {
        users: users.length,
        pendingRequests: pendingRequests.length,
        upcomingHolidays: upcomingHolidays.length,
        lists: taskLists,
    }

    const statsTranslations = {
        users: tAdmin("totalUsers"),
        pendingRequests: tAdmin("pendingRequests"),
        upcomingHolidays: tAdmin("upcomingHolidays"),
        lists: tAdmin("totalLists"),
    }

    const statusCounts = {
        PENDING: pendingRequests.length,
        APPROVED: approvedRequests.length,
        REJECTED: rejectedRequests.length,
        CANCELLED: cancelledRequests.length,
    }

    const statusTranslations = {
        title: tAdmin("requestStatusBreakdown"),
        description: tAdmin("requestStatusBreakdownDesc"),
        pending: tRequests("pending"),
        approved: tRequests("approved"),
        rejected: tRequests("rejected"),
        cancelled: tRequests("cancelled"),
    }

    const quickActionsTranslations = {
        title: tAdmin("quickActions"),
        description: tAdmin("quickActionsDesc"),
        manageUsers: tAdmin("manageUsers"),
        viewPendingRequests: tAdmin("reviewPendingRequests"),
        manageShifts: tAdmin("manageHolidays"),
        viewRequestHistory: tAdmin("viewRequestHistory"),
    }

    const recentRequestsTranslations = {
        title: tAdmin("recentPendingRequests"),
        description: tAdmin("recentPendingRequestsDesc"),
        viewAll: (params: { count: number }) => tAdmin("viewAllPending", params),
        user: tAdmin("user"),
        type: tAdmin("type"),
        period: tAdmin("period"),
    }

    const holidaysTranslations = {
        title: tAdmin("upcomingHolidaysSection"),
        description: tAdmin("upcomingHolidaysSectionDesc"),
        viewAll: (params: { count: number }) => tAdmin("viewAllHolidays", params),
    }

    return (
        <div className="flex flex-col gap-4">
            <StatsCards stats={stats} translations={statsTranslations} />

            <div className="grid gap-4 md:grid-cols-2">
                <RequestStatusBreakdown
                    statusCounts={statusCounts}
                    translations={statusTranslations}
                />
                <QuickActions translations={quickActionsTranslations} />
            </div>

            <RecentPendingRequests
                requests={recentPendingRequests}
                locale={locale}
                totalPending={pendingRequests.length}
                translations={recentRequestsTranslations}
            />

            <UpcomingHolidays
                holidays={upcomingHolidays}
                locale={locale}
                translations={holidaysTranslations}
            />
        </div>
    )
}
