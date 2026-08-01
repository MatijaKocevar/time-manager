import { getTranslations } from "next-intl/server"
import { UsersTableWrapper } from "./_components/users-table-wrapper"
import { loadUsersListData } from "./_loaders/users-list-data"
import { getTutorialsSeen, PageTour } from "@/features/tutorial"

export default async function AdminUsersPage() {
    const [data, tutorialsSeen, tTutorial, tAdminUsers] = await Promise.all([
        loadUsersListData(),
        getTutorialsSeen(),
        getTranslations("tutorial"),
        getTranslations("tutorial.adminUsers"),
    ])

    return (
        <>
            <PageTour
                pageKey="/admin/users"
                seenPages={tutorialsSeen}
                nextLabel={tTutorial("next")}
                prevLabel={tTutorial("previous")}
                doneLabel={tTutorial("done")}
                steps={[
                    {
                        element: "#users-toolbar",
                        title: tAdminUsers("toolbar.title"),
                        description: tAdminUsers("toolbar.description"),
                        side: "bottom",
                    },
                    {
                        element: "#users-table",
                        title: tAdminUsers("table.title"),
                        description: tAdminUsers("table.description"),
                        side: "top",
                    },
                ]}
            />
            <div className="flex flex-col gap-4 min-w-0 h-full">
                <UsersTableWrapper users={data.users} currentUserId={data.currentUserId} />
            </div>
        </>
    )
}
