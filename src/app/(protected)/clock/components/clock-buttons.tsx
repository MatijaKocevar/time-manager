"use client"

import { Button } from "@/components/ui/button"
import { LogIn, LogOut } from "lucide-react"
import { useClockIn, useClockOut } from "../hooks/use-clock-actions"

interface ClockButtonsProps {
    translations: {
        clockInButton: string
        clockOutButton: string
        clockInSuccess: string
        clockOutSuccess: string
        errorTitle: string
    }
}

export function ClockButtons({ translations }: ClockButtonsProps) {
    const { clockIn, isClockingIn } = useClockIn()
    const { clockOut, isClockingOut } = useClockOut()

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Button
                size="lg"
                className="h-24 text-lg"
                onClick={() =>
                    clockIn({
                        clockInSuccess: translations.clockInSuccess,
                        errorTitle: translations.errorTitle,
                    })
                }
                disabled={isClockingIn || isClockingOut}
            >
                <LogIn className="mr-2 h-6 w-6" />
                {translations.clockInButton}
            </Button>
            <Button
                size="lg"
                variant="secondary"
                className="h-24 text-lg"
                onClick={() =>
                    clockOut({
                        clockOutSuccess: translations.clockOutSuccess,
                        errorTitle: translations.errorTitle,
                    })
                }
                disabled={isClockingIn || isClockingOut}
            >
                <LogOut className="mr-2 h-6 w-6" />
                {translations.clockOutButton}
            </Button>
        </div>
    )
}
