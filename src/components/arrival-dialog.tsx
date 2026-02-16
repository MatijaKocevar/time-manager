"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { clockInToUrnik } from "@/app/(protected)/clock/actions/clock-actions"
import { toast } from "sonner"

interface ArrivalDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    translations: {
        title: string
        message: string
        yesButton: string
        noButton: string
        successMessage: string
        errorTitle: string
    }
}

export function ArrivalDialog({ open, onOpenChange, translations }: ArrivalDialogProps) {
    const [isLogging, setIsLogging] = useState(false)

    async function handleYes() {
        setIsLogging(true)
        try {
            const result = await clockInToUrnik()
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
                    <DialogDescription>{translations.message}</DialogDescription>
                </DialogHeader>
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
