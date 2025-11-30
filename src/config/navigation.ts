import { Users, Clock, Calendar, Timer, FileText, LucideIcon } from "lucide-react"
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
        title: "Users",
        url: "/users",
        icon: Users,
        roles: ["ADMIN"],
        children: [
            {
                title: "Requests",
                url: "/users/requests",
                icon: FileText,
                roles: ["ADMIN"],
            },
        ],
    },
]
