"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import NProgress from "nprogress"
import "nprogress/nprogress.css"
import { useNavigationStore } from "../stores/navigation-store"

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
        const handleAnchorClick = (event: MouseEvent) => {
            const target = event.currentTarget as HTMLAnchorElement
            const targetUrl = new URL(target.href)
            const currentUrl = new URL(window.location.href)

            if (targetUrl.pathname !== currentUrl.pathname) {
                NProgress.start()
                setNavigating(true)
            }
        }

        const handleMutation = () => {
            const anchorElements = document.querySelectorAll('a[href^="/"]')
            anchorElements.forEach((anchor) => {
                anchor.removeEventListener("click", handleAnchorClick as EventListener)
                anchor.addEventListener("click", handleAnchorClick as EventListener)
            })
        }

        handleMutation()

        const observer = new MutationObserver(handleMutation)
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        })

        return () => {
            observer.disconnect()
            const anchorElements = document.querySelectorAll('a[href^="/"]')
            anchorElements.forEach((anchor) => {
                anchor.removeEventListener("click", handleAnchorClick as EventListener)
            })
        }
    }, [setNavigating])

    return null
}
