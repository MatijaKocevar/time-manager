import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { SetBreadcrumbs } from "@/features/breadcrumbs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserById } from "../../actions/user-actions"
import { UserForm } from "../../components/user-form"

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        redirect("/login")
    }

    if (session.user.role !== "ADMIN") {
        redirect("/")
    }

    const { id } = await params
    const user = await getUserById(id)

    return (
        <>
            <SetBreadcrumbs
                items={[{ label: "Users", href: "/admin/users" }, { label: "Edit User" }]}
            />
            <div className="container max-w-2xl py-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit User</CardTitle>
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
