"use client"

import { useEffect, useLayoutEffect, useState } from "react"

const SIDEBAR_OPEN_KEY = "sidebar-open"

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

function readSidebarOpen(): boolean | null {
    try {
        const stored = localStorage.getItem(SIDEBAR_OPEN_KEY)
        return stored === null ? null : stored === "true"
    } catch {
        return null
    }
}

function writeSidebarOpen(open: boolean) {
    try {
        localStorage.setItem(SIDEBAR_OPEN_KEY, String(open))
    } catch {
        return
    }
}

export function useSidebarOpen() {
    const [open, setOpenState] = useState(true)

    useBrowserLayoutEffect(() => {
        const stored = readSidebarOpen()
        if (stored !== null) setOpenState(stored)
    }, [])

    function setOpen(value: boolean) {
        setOpenState(value)
        writeSidebarOpen(value)
    }

    return { open, setOpen }
}
