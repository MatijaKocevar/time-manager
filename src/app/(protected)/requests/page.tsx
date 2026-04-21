import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserRequests } from "./actions/request-actions"
import { RequestsTableWithDialog } from "./components/requests-table-with-dialog"
import { syncRequestStatuses } from "./actions/sync-request-statuses"
import { getTranslations } from "next-intl/server"
import { getTutorialsSeen, PageTour } from "@/features/tutorial"

export default async function RequestsPage() {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        return null
    }

    if (session.user.role === "ADMIN") {
        await syncRequestStatuses()
    }

    const [requests, userRecord, tutorialsSeen, tTutorial, tRequests] = await Promise.all([
        getUserRequests(),
        prisma.user.findUnique({
            where: { id: session.user.id },
            select: { urnikUsername: true },
        }),
        getTutorialsSeen(),
        getTranslations("tutorial"),
        getTranslations("tutorial.requests"),
    ])

    const hasUrnikCredentials = !!userRecord?.urnikUsername

    return (
        <>
            <PageTour
                pageKey="/requests"
                seenPages={tutorialsSeen}
                nextLabel={tTutorial("next")}
                prevLabel={tTutorial("previous")}
                doneLabel={tTutorial("done")}
                steps={[
                    {
                        element: "#requests-controls",
                        title: tRequests("controls.title"),
                        description: tRequests("controls.description"),
                        side: "bottom",
                    },
                    {
                        element: "#requests-new-btn",
                        title: tRequests("newRequest.title"),
                        description: tRequests("newRequest.description"),
                        side: "bottom",
                    },
                    {
                        element: "#requests-table",
                        title: tRequests("table.title"),
                        description: tRequests("table.description"),
                        side: "top",
                    },
                ]}
            />
            <div className="flex flex-col gap-4 min-w-0 h-full">
                <RequestsTableWithDialog
                    requests={requests}
                    showUser={false}
                    hasUrnikCredentials={hasUrnikCredentials}
                />
            </div>
        </>
    )
}
