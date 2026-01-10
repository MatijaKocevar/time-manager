"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export function LocaleSync() {
    const { data: session } = useSession()
    const router = useRouter()

    useEffect(() => {
        console.log("[LOCALE SYNC] Component mounted, session locale:", session?.user?.locale)

        if (session?.user?.locale) {
            const currentLocale = document.cookie
                .split("; ")
                .find((row) => row.startsWith("NEXT_LOCALE="))
                ?.split("=")[1]

            console.log(
                "[LOCALE SYNC] Current cookie:",
                currentLocale,
                "session locale:",
                session.user.locale
            )

            if (currentLocale !== session.user.locale) {
                console.log(
                    "[LOCALE SYNC] Mismatch detected! But user may have manually changed - skipping sync"
                )
            } else {
                console.log("[LOCALE SYNC] Cookie and session match, no sync needed")
            }
        } else {
            console.log("[LOCALE SYNC] No locale in session")
        }
    }, [session, router])

    return null
}
