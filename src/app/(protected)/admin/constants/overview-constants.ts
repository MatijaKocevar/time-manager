import { Users, CalendarDays, FileText, ClipboardList } from "lucide-react"

export const STAT_CONFIGS = [
    {
        key: "users" as const,
        icon: Users,
        color: "text-blue-600",
        href: "/admin/users",
    },
    {
        key: "pendingRequests" as const,
        icon: FileText,
        color: "text-yellow-600",
        href: "/admin/pending-requests",
    },
    {
        key: "upcomingHolidays" as const,
        icon: CalendarDays,
        color: "text-green-600",
        href: "/admin/shifts",
    },
    {
        key: "lists" as const,
        icon: ClipboardList,
        color: "text-purple-600",
        href: "/tasks",
    },
] as const

export const QUICK_ACTIONS = [
    {
        labelKey: "manageUsers" as const,
        href: "/admin/users",
    },
    {
        labelKey: "viewPendingRequests" as const,
        href: "/admin/pending-requests",
    },
    {
        labelKey: "manageShifts" as const,
        href: "/admin/shifts",
    },
    {
        labelKey: "viewRequestHistory" as const,
        href: "/admin/request-history",
    },
] as const

export const REQUEST_STATUS_CONFIGS = [
    {
        status: "PENDING" as const,
        color: "bg-yellow-500",
    },
    {
        status: "APPROVED" as const,
        color: "bg-green-500",
    },
    {
        status: "REJECTED" as const,
        color: "bg-red-500",
    },
    {
        status: "CANCELLED" as const,
        color: "bg-gray-500",
    },
] as const
