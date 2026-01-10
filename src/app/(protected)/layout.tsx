import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { Suspense } from "react"
import { authConfig } from "@/lib/auth"
import { CreateListDialog } from "./tasks/components/create-list-dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        redirect("/login")
    }

    return (
        <>
            <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
            <CreateListDialog />
        </>
    )
}
