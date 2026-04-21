"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Cookie } from "lucide-react"
import { saveCookieConsent } from "../actions/cookie-consent-actions"

interface CookieBannerProps {
    initialConsent: boolean | null
    title: string
    description: string
    acknowledgeLabel: string
}

export function CookieBanner({
    initialConsent,
    title,
    description,
    acknowledgeLabel,
}: CookieBannerProps) {
    const [visible, setVisible] = useState(initialConsent === null)
    const [isPending, startTransition] = useTransition()

    function handleAcknowledge() {
        startTransition(async () => {
            await saveCookieConsent(true)
            setVisible(false)
        })
    }

    if (!visible) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
            <div className="mx-auto max-w-2xl rounded-xl border bg-background shadow-lg">
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
                    <Cookie className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                    <div className="flex flex-1 flex-col gap-3">
                        <div>
                            <p className="text-sm font-semibold">{title}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button size="sm" disabled={isPending} onClick={handleAcknowledge}>
                                {acknowledgeLabel}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
