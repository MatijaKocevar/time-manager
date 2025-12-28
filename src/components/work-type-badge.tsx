import { cn } from "@/lib/utils"
import {
    getWorkTypeColor,
    type WorkType,
    type WorkTypeVariant,
    type ShiftLocation,
} from "@/lib/work-type-styles"

interface WorkTypeBadgeProps {
    type: WorkType | ShiftLocation
    variant?: WorkTypeVariant
    className?: string
    children?: React.ReactNode
}

export function WorkTypeBadge({
    type,
    variant = "default",
    className,
    children,
}: WorkTypeBadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
                getWorkTypeColor(type, variant),
                className
            )}
        >
            {children}
        </span>
    )
}
