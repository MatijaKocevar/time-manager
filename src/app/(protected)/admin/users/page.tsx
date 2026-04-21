import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { UsersTableWrapper } from "./components/users-table"
import { getUsers } from "./actions/user-actions"
import { getTranslations } from "next-intl/server"
import { getTutorialsSeen, PageTour } from "@/features/tutorial"

export default async function AdminUsersPage() {
    const session = await getServerSession(authConfig)
    const [users, tutorialsSeen, tTutorial, tAdminUsers] = await Promise.all([
        getUsers(true),
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
                <UsersTableWrapper users={users} currentUserId={session!.user.id} />
            </div>
        </>
    )
}
