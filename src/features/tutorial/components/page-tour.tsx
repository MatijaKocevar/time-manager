"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import { markTutorialSeen } from "../actions/tutorial-actions"
import type { TourStep } from "../types"

const DEMO_STORAGE_KEY = "demo_tutorials_seen"

function getDemoSeenPages(): string[] {
    try {
        return JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) ?? "[]")
    } catch {
        return []
    }
}

function markDemoPageSeen(pageKey: string) {
    const seen = getDemoSeenPages()
    if (!seen.includes(pageKey)) {
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify([...seen, pageKey]))
    }
}

interface PageTourProps {
    pageKey: string
    seenPages: string[]
    steps: TourStep[]
    nextLabel: string
    prevLabel: string
    doneLabel: string
}

export function PageTour({
    pageKey,
    seenPages,
    steps,
    nextLabel,
    prevLabel,
    doneLabel,
}: PageTourProps) {
    const { data: session } = useSession()
    const isDemo = session?.user?.isDemo ?? false

    useEffect(() => {
        if (isDemo) {
            if (getDemoSeenPages().includes(pageKey)) return
        } else {
            if (seenPages.includes(pageKey)) return
        }

        const driverObj = driver({
            showProgress: true,
            progressText: "{{current}} / {{total}}",
            nextBtnText: nextLabel,
            prevBtnText: prevLabel,
            doneBtnText: doneLabel,
            allowClose: true,
            overlayOpacity: 0.5,
            stagePadding: 4,
            stageRadius: 6,
            steps: steps.map((s) => ({
                element: s.element,
                popover: {
                    title: s.title,
                    description: s.description,
                    side: s.side,
                },
            })),
            onDestroyStarted: () => {
                if (isDemo) {
                    markDemoPageSeen(pageKey)
                } else {
                    markTutorialSeen(pageKey).catch(console.error)
                }
                driverObj.destroy()
            },
        })

        driverObj.drive()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seenPages, isDemo])

    return null
}
