import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTranslations } from "next-intl/server"
import { STAT_CONFIGS } from "../constants"

interface StatsCardsProps {
    stats: {
        users: number
        pendingRequests: number
        upcomingHolidays: number
        lists: number
    }
}

export async function StatsCards({ stats }: StatsCardsProps) {
    const t = await getTranslations("admin.overview")

    const translations = {
        users: t("totalUsers"),
        pendingRequests: t("pendingRequests"),
        upcomingHolidays: t("upcomingHolidays"),
        lists: t("totalLists"),
    }
    return (
        <div id="admin-stats" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {STAT_CONFIGS.map(({ key, icon: Icon, color, href }) => (
                <Link key={key} href={href}>
                    <Card className="hover:bg-accent transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {translations[key]}
                            </CardTitle>
                            <Icon className={`h-4 w-4 ${color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats[key]}</div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    )
}
