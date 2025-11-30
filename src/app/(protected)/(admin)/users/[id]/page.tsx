import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserById } from "../actions/user-actions"
import { UserForm } from "../components/user-form"
import { SetBreadcrumbData } from "@/features/breadcrumbs"

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const user = await getUserById(id)

    return (
        <>
            <SetBreadcrumbData
                data={{
                    [`/users/${id}`]: user.name || "User",
                }}
            />
            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>{user.name}</CardTitle>
                        <CardDescription>Update user information</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <UserForm user={user} />
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
