import {
    Users,
    Clock,
    Calendar,
    Timer,
    FileText,
    Shield,
    ClockAlert,
    History,
    CalendarDays,
    CalendarX2,
    Wrench,
    LucideIcon,
    FileSpreadsheet,
    CalendarRange,
    RefreshCw,
    LogIn,
} from "lucide-react"
import { UserRole } from "@/types"

export interface NavigationItem {
    title: string
    url: string
    icon: LucideIcon
    roles: UserRole[]
    children?: NavigationItem[]
}

export const navigationItems: NavigationItem[] = [
    {
        title: "navigation.timeTracker",
        url: "/tracker",
        icon: Timer,
        roles: ["USER", "ADMIN"],
    },
    {
        title: "navigation.timeSheets",
        url: "/time-sheets",
        icon: FileSpreadsheet,
        roles: ["USER", "ADMIN"],
    },
    {
        title: "navigation.tasks",
        url: "/tasks",
        icon: Calendar,
        roles: ["USER", "ADMIN"],
    },
    {
        title: "navigation.shifts",
        url: "/shifts",
        icon: CalendarDays,
        roles: ["USER", "ADMIN"],
    },
    {
        title: "navigation.yearlyCalendar",
        url: "/yearly-calendar",
        icon: CalendarRange,
        roles: ["USER", "ADMIN"],
    },
    {
        title: "navigation.hours",
        url: "/hours",
        icon: Clock,
        roles: ["USER", "ADMIN"],
    },
    {
        title: "navigation.requests",
        url: "/requests",
        icon: FileText,
        roles: ["USER", "ADMIN"],
    },
    {
        title: "navigation.urnikNetOverview",
        url: "/urnik-net-overview",
        icon: LogIn,
        roles: ["USER", "ADMIN"],
        children: [
            {
                title: "navigation.urnikNetRequests",
                url: "/urnik-net-overview/requests",
                icon: RefreshCw,
                roles: ["USER", "ADMIN"],
            },
            {
                title: "navigation.urnikNetHours",
                url: "/urnik-net-overview/hours",
                icon: FileSpreadsheet,
                roles: ["USER", "ADMIN"],
            },
        ],
    },
    {
        title: "navigation.admin",
        url: "/admin",
        icon: Shield,
        roles: ["ADMIN"],
        children: [
            {
                title: "navigation.userManagement",
                url: "/admin/users",
                icon: Users,
                roles: ["ADMIN"],
            },
            {
                title: "navigation.pendingRequests",
                url: "/admin/pending-requests",
                icon: ClockAlert,
                roles: ["ADMIN"],
            },
            {
                title: "navigation.requestHistory",
                url: "/admin/request-history",
                icon: History,
                roles: ["ADMIN"],
            },
            {
                title: "navigation.holidays",
                url: "/admin/holidays",
                icon: CalendarX2,
                roles: ["ADMIN"],
            },
            {
                title: "navigation.devTools",
                url: "/admin/dev",
                icon: Wrench,
                roles: ["ADMIN"],
            },
        ],
    },
]
