import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Home() {
    const session = await getServerSession(authConfig)

    if (!session) {
        redirect("/login")
    }

    redirect("/time-sheets")
}
