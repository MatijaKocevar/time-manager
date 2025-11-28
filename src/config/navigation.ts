import { Users } from "lucide-react"
import { UserRole } from "@/types"

export interface NavigationItem {
    title: string
    url: string
    icon: typeof Users
    roles: UserRole[]
}

export const navigationItems: NavigationItem[] = [
    {
        title: "Users",
        url: "/admin/users",
        icon: Users,
        roles: ["ADMIN"],
    },
]
