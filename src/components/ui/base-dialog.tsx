"use client"

import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

const sizeClasses = {
    default: "sm:max-w-lg",
    sm: "sm:max-w-sm",
    lg: "sm:max-w-xl",
    xl: "sm:max-w-3xl",
    full: "sm:max-w-5xl",
} as const

interface BaseDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string | React.ReactNode
    description?: string
    children: React.ReactNode
    footer?: React.ReactNode
    className?: string
    size?: keyof typeof sizeClasses
}

export function BaseDialog({
    open,
    onOpenChange,
    title,
    description,
    children,
    footer,
    className,
    size = "default",
}: BaseDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn(sizeClasses[size], className)}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                {children}
                {footer && <DialogFooter>{footer}</DialogFooter>}
            </DialogContent>
        </Dialog>
    )
}
