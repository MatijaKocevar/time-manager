import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { authConfig } from "@/lib/auth"
import { RequestHistoryTable } from "./_components/request-history-table-wrapper"
import { getTutorialsSeen, PageTour } from "@/features/tutorial"
import { loadRequestHistoryData } from "./_loaders/request-history-data"

export default async function RequestHistoryPage() {
    const session = await getServerSession(authConfig)

    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/")
    }

    const [data, tutorialsSeen, tTutorial, tAdminHistory] = await Promise.all([
        loadRequestHistoryData(),
        getTutorialsSeen(),
        getTranslations("tutorial"),
        getTranslations("tutorial.adminRequestHistory"),
    ])

    return (
        <>
            <PageTour
                pageKey="/admin/request-history"
                seenPages={tutorialsSeen}
                nextLabel={tTutorial("next")}
                prevLabel={tTutorial("previous")}
                doneLabel={tTutorial("done")}
                steps={[
                    {
                        element: "#history-table",
                        title: tAdminHistory("table.title"),
                        description: tAdminHistory("table.description"),
                        side: "top",
                    },
                ]}
            />
            <div className="flex flex-col gap-4 h-full">
                <div className="flex-1 min-h-0">
                    <RequestHistoryTable requests={data.requests} locale={data.locale} />
                </div>
            </div>
        </>
    )
}
