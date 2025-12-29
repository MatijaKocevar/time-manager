import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { Suspense } from "react"
import { authConfig } from "@/lib/auth"
import { CreateListDialog } from "./tasks/components/create-list-dialog"
import { LocaleSync } from "@/features/locale/components/locale-sync"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        redirect("/login")
    }

    return (
        <>
            <LocaleSync />
            <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
            <CreateListDialog />
        </>
    )
}
