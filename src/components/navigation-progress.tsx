"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import NProgress from "nprogress"
import "nprogress/nprogress.css"
import { useNavigationStore } from "@/stores/navigation-store"

NProgress.configure({ showSpinner: false })

export function NavigationProgress() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const setNavigating = useNavigationStore((state) => state.setNavigating)

    useEffect(() => {
        NProgress.done()
        setNavigating(false)
    }, [pathname, searchParams, setNavigating])

    useEffect(() => {
        const handleStart = () => {
            NProgress.start()
            setNavigating(true)
        }

        const handleComplete = () => {
            NProgress.done()
            setNavigating(false)
        }

        const handleError = () => {
            NProgress.done()
            setNavigating(false)
        }

        window.addEventListener("beforeunload", handleStart)

        return () => {
            window.removeEventListener("beforeunload", handleStart)
        }
    }, [setNavigating])

    return null
}
