"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { updateMyShift, updateUserShift } from "../actions/shift-actions"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ShiftLocation } from "../schemas/shift-schemas"

interface EditShiftDialogProps {
    isOpen: boolean
    onClose: () => void
    date: Date
    userId?: string
    userName?: string
    currentLocation?: ShiftLocation
    currentNotes?: string
}

export function EditShiftDialog({
    isOpen,
    onClose,
    date,
    userId,
    userName,
    currentLocation,
    currentNotes,
}: EditShiftDialogProps) {
    const { data: session } = useSession()
    const isAdmin = session?.user?.role === "ADMIN"
    const [location, setLocation] = useState<ShiftLocation>(currentLocation || "OFFICE")
    const [notes, setNotes] = useState(currentNotes || "")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        const result =
            userId && isAdmin
                ? await updateUserShift({ userId, date, location, notes: notes || undefined })
                : await updateMyShift({ date, location, notes: notes || undefined })

        setIsLoading(false)

        if (result.error) {
            setError(result.error)
        } else {
            onClose()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Shift {userName && `- ${userName}`}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Date</Label>
                        <div className="text-sm text-muted-foreground">
                            {date.toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Select
                            value={location}
                            onValueChange={(value) => setLocation(value as ShiftLocation)}
                            disabled={isLoading}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="OFFICE">Office</SelectItem>
                                <SelectItem value="HOME">Work from Home</SelectItem>
                                <SelectItem value="VACATION">Vacation</SelectItem>
                                <SelectItem value="SICK_LEAVE">Sick Leave</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                setNotes(e.target.value)
                            }
                            disabled={isLoading}
                            rows={3}
                        />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
