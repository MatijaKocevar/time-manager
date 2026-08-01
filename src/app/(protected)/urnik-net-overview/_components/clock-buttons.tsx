"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { LogIn, LogOut } from "lucide-react"
import { useClockIn, useClockOut } from "../_hooks/use-clock-actions"

interface ClockButtonsProps {
    translations: {
        clockInButton: string
        clockOutButton: string
        clockInSuccess: string
        clockOutSuccess: string
        errorTitle: string
        workFromHomeCheckbox: string
        workFromHomeApproved: string
        atLocation: string
    }
    hasApprovedWFH: boolean
    wfhLocation: string | null
}

export function ClockButtons({ translations, hasApprovedWFH, wfhLocation }: ClockButtonsProps) {
    const [isWorkFromHome, setIsWorkFromHome] = useState(hasApprovedWFH)
    const { clockIn, isClockingIn } = useClockIn()
    const { clockOut, isClockingOut } = useClockOut()

    return (
        <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                <Checkbox
                    id="work-from-home"
                    checked={isWorkFromHome}
                    onCheckedChange={(checked) => setIsWorkFromHome(checked === true)}
                />
                <div className="flex-1 space-y-1">
                    <Label
                        htmlFor="work-from-home"
                        className="text-sm font-medium leading-none cursor-pointer"
                    >
                        {translations.workFromHomeCheckbox}
                    </Label>
                    {hasApprovedWFH && (
                        <p className="text-sm text-muted-foreground">
                            {translations.workFromHomeApproved}
                            {wfhLocation && <> {translations.atLocation}</>}
                        </p>
                    )}
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <Button
                    size="lg"
                    className="h-24 text-lg"
                    onClick={() =>
                        clockIn({
                            clockInSuccess: translations.clockInSuccess,
                            errorTitle: translations.errorTitle,
                            isWorkFromHome,
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
        </div>
    )
}
