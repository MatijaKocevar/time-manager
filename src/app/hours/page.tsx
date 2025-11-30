import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SetBreadcrumbs } from "@/features/breadcrumbs"

export default async function HoursPage() {
    const session = await getServerSession(authConfig)

    if (!session) {
        redirect("/login")
    }

    return <SetBreadcrumbs items={[{ label: "Hours" }]} />
}
