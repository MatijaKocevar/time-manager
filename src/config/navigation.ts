import {
    Users,
    Clock,
    Calendar,
    Timer,
    FileText,
    Shield,
    ClockAlert,
    History,
    LucideIcon,
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
        title: "Time Tracker",
        url: "/tracker",
        icon: Timer,
        roles: ["USER", "ADMIN"],
    },
    {
        title: "Tasks",
        url: "/tasks",
        icon: Calendar,
        roles: ["USER", "ADMIN"],
    },
    {
        title: "Hours",
        url: "/hours",
        icon: Clock,
        roles: ["USER", "ADMIN"],
    },
    {
        title: "Requests",
        url: "/requests",
        icon: FileText,
        roles: ["USER", "ADMIN"],
    },
    {
        title: "Admin",
        url: "/admin",
        icon: Shield,
        roles: ["ADMIN"],
        children: [
            {
                title: "User Management",
                url: "/admin/users",
                icon: Users,
                roles: ["ADMIN"],
            },
            {
                title: "Pending Requests",
                url: "/admin/pending-requests",
                icon: ClockAlert,
                roles: ["ADMIN"],
            },
            {
                title: "Request History",
                url: "/admin/request-history",
                icon: History,
                roles: ["ADMIN"],
            },
        ],
    },
]
