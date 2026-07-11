"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DayInfoDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    date: string
    dayOfWeek: string
    graphColors: string[] | null
    translations: {
        title: string
        comingSoon: string
    }
}

export function DayInfoDialog({
    open,
    onOpenChange,
    date,
    dayOfWeek,
    graphColors,
    translations,
}: DayInfoDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {translations.title} — {date} ({dayOfWeek})
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 pt-2">
                    {graphColors && (
                        <div className="flex items-center gap-[1px]">
                            {graphColors.map((color, i) => {
                                const isWhite = /^#(fff|ffffff)$/i.test(color) || color === "white"
                                return (
                                    <span
                                        key={i}
                                        className={`inline-block h-2 w-[5px] ${isWhite ? "border border-gray-300 dark:border-gray-500" : ""}`}
                                        style={{ backgroundColor: color }}
                                    />
                                )
                            })}
                        </div>
                    )}
                    <p className="text-sm text-muted-foreground">{translations.comingSoon}</p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
