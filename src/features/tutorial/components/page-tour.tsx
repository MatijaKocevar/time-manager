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
    skipLabel: string
    progressLabel: string
}

export function PageTour({
    pageKey,
    seenPages,
    steps,
    nextLabel,
    prevLabel,
    doneLabel,
    skipLabel,
    progressLabel,
}: PageTourProps) {
    useEffect(() => {
        if (seenPages.includes(pageKey)) return

        const driverObj = driver({
            showProgress: true,
            progressText: progressLabel,
            nextBtnText: nextLabel,
            prevBtnText: prevLabel,
            doneBtnText: doneLabel,
            allowClose: true,
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
    }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
