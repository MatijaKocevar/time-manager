import { Users, Clock, Calendar, Timer, LucideIcon } from "lucide-react"
import { UserRole } from "@/types"

export interface NavigationItem {
    title: string
    url: string
    icon: LucideIcon
    roles: UserRole[]
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
        title: "Users",
        url: "/users",
        icon: Users,
        roles: ["ADMIN"],
    },
]
