import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { CreateListDialog } from "./tasks/components/create-list-dialog"
import { LocaleSync } from "@/components/locale-sync"

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        redirect("/login")
    }

    return (
        <>
            <LocaleSync />
            {children}
            <CreateListDialog />
        </>
    )
}
