import { getTranslations } from "next-intl/server"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authConfig } from "@/lib/auth"
import { PendingRequestsTable } from "./_components/pending-requests-table-wrapper"
import { getTutorialsSeen, PageTour } from "@/features/tutorial"
import { loadPendingRequestsData } from "./_loaders/pending-requests-data"

export default async function PendingRequestsPage() {
    const session = await getServerSession(authConfig)

    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/")
    }

    const [data, tutorialsSeen, tTutorial, tAdminPending] = await Promise.all([
        loadPendingRequestsData(),
        getTutorialsSeen(),
        getTranslations("tutorial"),
        getTranslations("tutorial.adminPendingRequests"),
    ])

    return (
        <>
            <PageTour
                pageKey="/admin/pending-requests"
                seenPages={tutorialsSeen}
                nextLabel={tTutorial("next")}
                prevLabel={tTutorial("previous")}
                doneLabel={tTutorial("done")}
                steps={[
                    {
                        element: "#pending-table",
                        title: tAdminPending("table.title"),
                        description: tAdminPending("table.description"),
                        side: "top",
                    },
                ]}
            />
            <div className="flex flex-col gap-4 h-full">
                <div className="flex-1 min-h-0">
                    <PendingRequestsTable
                        requests={data.requests}
                        holidays={data.holidays}
                        locale={data.locale}
                    />
                </div>
            </div>
        </>
    )
}
