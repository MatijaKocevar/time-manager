"use client"

import { useEffect, useRef } from "react"
import PullToRefresh from "pulltorefreshjs"
import "./pull-to-refresh.css"

export function PullToRefreshContainer({ children }: { children: React.ReactNode }) {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
        const isPWA =
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as { standalone?: boolean }).standalone === true

        if (isIOS && isPWA && containerRef.current) {
            const container = containerRef.current
            container.setAttribute("data-ptr", "true")

            const ptr = PullToRefresh.init({
                mainElement: '[data-ptr="true"]',
                triggerElement: '[data-ptr="true"]',
                onRefresh() {
                    window.location.reload()
                },
                shouldPullToRefresh() {
                    return container.scrollTop === 0
                },
                iconArrow: "↻",
                iconRefreshing:
                    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
                instructionsPullToRefresh: "Pull to refresh",
                instructionsReleaseToRefresh: "Release to refresh",
                instructionsRefreshing: "Refreshing",
            })

            return () => {
                ptr.destroy()
                container.removeAttribute("data-ptr")
            }
        }
    }, [])

    return (
        <div ref={containerRef} className="flex-1 p-4 overflow-auto min-w-0">
            {children}
        </div>
    )
}
