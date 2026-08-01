"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { clockInToUrnik } from "@/app/(protected)/urnik-net-overview/_actions/clock-actions"
import { toast } from "sonner"

interface ArrivalDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    hasApprovedWFH?: boolean
    wfhLocation?: string | null
    translations: {
        title: string
        message: string
        yesButton: string
        noButton: string
        successMessage: string
        errorTitle: string
        workFromHomeCheckbox: string
        workFromHomeApproved: string
    }
}

export function ArrivalDialog({
    open,
    onOpenChange,
    hasApprovedWFH,
    wfhLocation,
    translations,
}: ArrivalDialogProps) {
    const [isLogging, setIsLogging] = useState(false)
    const [isWorkFromHome, setIsWorkFromHome] = useState(hasApprovedWFH ?? false)
    const tClock = useTranslations("clock.arrivalDialog")

    async function handleYes() {
        setIsLogging(true)
        try {
            const result = await clockInToUrnik(isWorkFromHome)
            if (result.success) {
                toast.success(translations.successMessage)
                onOpenChange(false)
            } else {
                toast.error(translations.errorTitle, {
                    description: result.error,
                })
            }
        } catch (error) {
            toast.error(translations.errorTitle, {
                description: error instanceof Error ? error.message : "Unknown error",
            })
        } finally {
            setIsLogging(false)
        }
    }

    function handleNo() {
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{translations.title}</DialogTitle>
                    <DialogDescription>
                        {translations.message}
                        {hasApprovedWFH && wfhLocation && (
                            <div className="mt-2 text-sm text-muted-foreground">
                                {translations.workFromHomeApproved}{" "}
                                {tClock("atLocation", { location: wfhLocation })}
                            </div>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2 py-2">
                    <Checkbox
                        id="wfh"
                        checked={isWorkFromHome}
                        onCheckedChange={(checked) => setIsWorkFromHome(checked === true)}
                    />
                    <label
                        htmlFor="wfh"
                        className="text-sm cursor-pointer font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        {translations.workFromHomeCheckbox}
                    </label>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleNo} disabled={isLogging}>
                        {translations.noButton}
                    </Button>
                    <Button onClick={handleYes} disabled={isLogging}>
                        {isLogging ? "Logging..." : translations.yesButton}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
