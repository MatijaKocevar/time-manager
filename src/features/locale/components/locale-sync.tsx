"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export function LocaleSync() {
    const { data: session } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (session?.user?.locale) {
            const currentLocale = document.cookie
                .split("; ")
                .find((row) => row.startsWith("NEXT_LOCALE="))
                ?.split("=")[1]

            if (currentLocale !== session.user.locale) {
                // Mismatch detected - skipping sync to preserve manual changes
            }
        }
    }, [session, router])

    return null
}
