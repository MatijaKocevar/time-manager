import { getTranslations } from "next-intl/server"
import { Card, CardContent } from "@/components/ui/card"
import { UserForm } from "../components/user-form"
import { SetBreadcrumbData } from "@/features/breadcrumbs/set-breadcrumb-data"

export default async function CreateUserPage() {
    const t = await getTranslations("admin.users.form")

    return (
        <>
            <SetBreadcrumbData
                data={{
                    "/admin/users/create": t("createUser"),
                }}
            />
            <Card>
                <CardContent>
                    <UserForm />
                </CardContent>
            </Card>
        </>
    )
}
