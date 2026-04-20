"use client"

import { useEffect } from "react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import { markTutorialSeen } from "../actions/tutorial-actions"
import type { TourStep } from "../types"

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
    useEffect(() => {
        if (seenPages.includes(pageKey)) return

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
                markTutorialSeen(pageKey).catch(console.error)
                driverObj.destroy()
            },
        })

        driverObj.drive()
    // seenPages changing means the server re-fetched — re-run to start the tour
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seenPages])

    return null
}
