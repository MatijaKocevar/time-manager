import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getUserById } from "../actions/user-actions"
import { EditUserForm } from "../components/edit-user-form"
import { SetBreadcrumbData } from "@/features/breadcrumbs"
import { getHourEntriesForUser } from "@/app/(protected)/hours/actions/hour-actions"
import { getHolidaysInRange } from "../../holidays/actions/holiday-actions"
import { getUserRequestsForAdmin } from "@/app/(protected)/requests/actions/request-actions"
import { RequestsTable } from "@/app/(protected)/requests/components/requests-table"
import { UserHoursSection } from "./components/user-hours-section"

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

    const [user, userHours, userRequests, holidays] = await Promise.all([
        getUserById(id),
        getHourEntriesForUser(id, startDate, endDate),
        getUserRequestsForAdmin(id),
        getHolidaysInRange(startDate, endDate),
    ])

    return (
        <>
            <SetBreadcrumbData
                data={{
                    [`/admin/users/${id}`]: user.name || "User",
                }}
            />
            <div className="flex flex-col gap-6">
                <Card>
                    <CardContent>
                        <EditUserForm user={user} />
                    </CardContent>
                </Card>

                <Separator />

                <UserHoursSection
                    userId={id}
                    initialEntries={userHours}
                    initialHolidays={holidays}
                />

                <Separator />

                <Card>
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
