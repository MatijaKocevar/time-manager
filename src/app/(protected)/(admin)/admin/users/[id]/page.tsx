import { Card, CardContent } from "@/components/ui/card"
import { getUserById } from "../actions/user-actions"
import { EditUserForm } from "../components/edit-user-form"
import { SetBreadcrumbData } from "@/features/breadcrumbs"

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const user = await getUserById(id)

    return (
        <>
            <SetBreadcrumbData
                data={{
                    [`/admin/users/${id}`]: user.name || "User",
                }}
            />
            <Card>
                <CardContent>
                    <EditUserForm user={user} />
                </CardContent>
            </Card>
        </>
    )
}
