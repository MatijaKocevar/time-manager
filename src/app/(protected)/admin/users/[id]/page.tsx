import { getTranslations } from "next-intl/server"
import { getServerSession } from "next-auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { authConfig } from "@/lib/auth"
import { getUserById } from "../actions/user-actions"
import { EditUserForm } from "../components/edit-user-form"
import {
    getHourEntriesForUser,
    getAttendanceDataForUser,
} from "@/app/(protected)/hours/actions/hour-actions"
import { getHolidaysInRange } from "../../holidays/actions/holiday-actions"
import { getUserRequestsForAdmin } from "@/app/(protected)/requests/actions/request-actions"
import { RequestsTable } from "@/app/(protected)/requests/components/requests-table"
import { UserHoursSection } from "./components/user-hours-section"
import { getTutorialsSeen, PageTour } from "@/features/tutorial"

function getCurrentMonthDates() {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
    }

    return {
        startDate: formatDate(firstDay),
        endDate: formatDate(lastDay),
        firstDay,
        lastDay,
    }
}

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const t = await getTranslations("admin.users.detail")
    const { startDate, endDate } = getCurrentMonthDates()
    const session = await getServerSession(authConfig)

    const [
        user,
        userHours,
        userRequests,
        holidays,
        attendanceData,
        tutorialsSeen,
        tTutorial,
        tAdminUserDetail,
    ] = await Promise.all([
        getUserById(id),
        getHourEntriesForUser(id, startDate, endDate),
        getUserRequestsForAdmin(id),
        getHolidaysInRange(startDate, endDate),
        getAttendanceDataForUser(id, startDate, endDate),
        getTutorialsSeen(),
        getTranslations("tutorial"),
        getTranslations("tutorial.adminUserDetail"),
    ])

    return (
        <>
            <PageTour
                pageKey="/admin/users/detail"
                seenPages={tutorialsSeen}
                nextLabel={tTutorial("next")}
                prevLabel={tTutorial("previous")}
                doneLabel={tTutorial("done")}
                steps={[
                    {
                        element: "#user-edit-form",
                        title: tAdminUserDetail("editForm.title"),
                        description: tAdminUserDetail("editForm.description"),
                        side: "bottom",
                    },
                    {
                        element: "#user-hours",
                        title: tAdminUserDetail("hours.title"),
                        description: tAdminUserDetail("hours.description"),
                        side: "bottom",
                    },
                    {
                        element: "#user-requests",
                        title: tAdminUserDetail("requests.title"),
                        description: tAdminUserDetail("requests.description"),
                        side: "bottom",
                    },
                ]}
            />
            <div className="flex flex-col gap-6">
                <Card id="user-edit-form">
                    <CardContent>
                        <EditUserForm
                            user={user}
                            currentUserIsDemo={session?.user?.isDemo || false}
                        />
                    </CardContent>
                </Card>

                <Separator />

                <div id="user-hours">
                    <UserHoursSection
                        userId={id}
                        user={user}
                        initialEntries={userHours}
                        initialHolidays={holidays}
                        initialAttendanceData={attendanceData}
                    />
                </div>

                <Separator />

                <Card id="user-requests">
                    <CardHeader>
                        <CardTitle>{t("requests")}</CardTitle>
                        <CardDescription>{t("requestsDescription")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RequestsTable
                            requests={userRequests}
                            showUser={false}
                            showNewButton={false}
                        />
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
