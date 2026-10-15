"use client"

import { useSyncExternalStore } from "react"

const DESKTOP_MEDIA_QUERY = "(min-width: 640px)"

let mediaQueryList: MediaQueryList | null = null

function getMediaQueryList() {
    if (!mediaQueryList) {
        mediaQueryList = window.matchMedia(DESKTOP_MEDIA_QUERY)
    }

    return mediaQueryList
}

function subscribe(onStoreChange: () => void) {
    const mediaQuery = getMediaQueryList()

    mediaQuery.addEventListener("change", onStoreChange)

    return () => mediaQuery.removeEventListener("change", onStoreChange)
}

function getSnapshot() {
    return getMediaQueryList().matches
}

function getServerSnapshot() {
    return null
}

export function useIsDesktop() {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
