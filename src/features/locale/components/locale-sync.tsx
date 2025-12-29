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
                fetch("/api/set-locale", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ locale: session.user.locale }),
                }).then((response) => {
                    if (response.ok) {
                        router.refresh()
                    }
                })
            }
        }
    }, [session, router])

    return null
}
