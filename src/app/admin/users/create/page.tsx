import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { SetBreadcrumbs } from "@/features/breadcrumbs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserForm } from "../components/user-form"

export default async function CreateUserPage() {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        redirect("/login")
    }

    if (session.user.role !== "ADMIN") {
        redirect("/")
    }

    return (
        <>
            <SetBreadcrumbs
                items={[{ label: "Users", href: "/admin/users" }, { label: "Create User" }]}
            />
            <div className="container max-w-2xl py-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Create User</CardTitle>
                        <CardDescription>Add a new user to the system</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <UserForm />
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
