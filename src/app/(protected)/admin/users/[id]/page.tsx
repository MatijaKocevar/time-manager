import { getTranslations } from "next-intl/server"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { EditUserForm } from "../components/edit-user-form-wrapper"
import { UserHoursSection } from "./components/user-hours-section-wrapper"
import { RequestsCard } from "./components/requests-card"
import { getTutorialsSeen, PageTour } from "@/features/tutorial"
import { loadUserDetailData } from "../loaders/user-detail-data"

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const [data, tutorialsSeen, tTutorial, tAdminUserDetail] = await Promise.all([
        loadUserDetailData(id),
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
                        <EditUserForm user={data.user} currentUserIsDemo={data.currentUserIsDemo} />
                    </CardContent>
                </Card>

                <Separator />

                <div id="user-hours">
                    <UserHoursSection
                        userId={id}
                        workHoursPerDay={data.user.workHoursPerDay}
                        initialEntries={data.userHours}
                        initialHolidays={data.holidays}
                        initialAttendanceData={data.attendanceData}
                    />
                </div>

                <Separator />

                <RequestsCard requests={data.userRequests} />
            </div>
        </>
    )
}
