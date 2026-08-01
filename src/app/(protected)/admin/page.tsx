import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authConfig } from "@/lib/auth"
import { getTranslations } from "next-intl/server"
import { StatsCards } from "./_components/stats-cards"
import { RequestStatusBreakdown } from "./_components/request-status-breakdown"
import { QuickActions } from "./_components/quick-actions"
import { RecentPendingRequests } from "./_components/recent-pending-requests"
import { UpcomingHolidays } from "./_components/upcoming-holidays"
import { ManagedUsersSection } from "./_components/managed-users-section"
import { loadOverviewData } from "./_loaders/overview-data"
import { getTutorialsSeen, PageTour } from "@/features/tutorial"

export default async function AdminOverviewPage() {
    const session = await getServerSession(authConfig)

    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/")
    }

    const [data, tutorialsSeen, tTutorial, tAdminOverview] = await Promise.all([
        loadOverviewData(),
        getTutorialsSeen(),
        getTranslations("tutorial"),
        getTranslations("tutorial.adminOverview"),
    ])

    return (
        <>
            <PageTour
                pageKey="/admin"
                seenPages={tutorialsSeen}
                nextLabel={tTutorial("next")}
                prevLabel={tTutorial("previous")}
                doneLabel={tTutorial("done")}
                steps={[
                    {
                        element: "#admin-stats",
                        title: tAdminOverview("stats.title"),
                        description: tAdminOverview("stats.description"),
                        side: "bottom",
                    },
                    {
                        element: "#admin-status-breakdown",
                        title: tAdminOverview("statusBreakdown.title"),
                        description: tAdminOverview("statusBreakdown.description"),
                        side: "bottom",
                    },
                    {
                        element: "#admin-quick-actions",
                        title: tAdminOverview("quickActions.title"),
                        description: tAdminOverview("quickActions.description"),
                        side: "bottom",
                    },
                    {
                        element: "#admin-recent-requests",
                        title: tAdminOverview("recentRequests.title"),
                        description: tAdminOverview("recentRequests.description"),
                        side: "bottom",
                    },
                    {
                        element: "#admin-upcoming-holidays",
                        title: tAdminOverview("upcomingHolidays.title"),
                        description: tAdminOverview("upcomingHolidays.description"),
                        side: "bottom",
                    },
                ]}
            />
            <div className="flex flex-col gap-4">
                <StatsCards stats={data.stats} />

                <div className="grid gap-4 md:grid-cols-2">
                    <RequestStatusBreakdown statusCounts={data.statusCounts} />
                    <QuickActions />
                </div>

                <ManagedUsersSection />

                <RecentPendingRequests
                    requests={data.recentPendingRequests}
                    locale={data.locale}
                    totalPending={data.totalPending}
                />

                <UpcomingHolidays holidays={data.upcomingHolidays} locale={data.locale} />
            </div>
        </>
    )
}
