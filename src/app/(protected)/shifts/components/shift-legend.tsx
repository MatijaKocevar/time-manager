import { Badge } from "@/components/ui/badge"
import type { ShiftLocation } from "../schemas/shift-schemas"

interface ShiftLegendProps {}

const locationColors: Record<ShiftLocation, { bg: string; text: string; label: string }> = {
    OFFICE: {
        bg: "bg-blue-100 dark:bg-blue-950",
        text: "text-blue-800 dark:text-blue-200",
        label: "Office",
    },
    HOME: {
        bg: "bg-green-100 dark:bg-green-950",
        text: "text-green-800 dark:text-green-200",
        label: "Work from Home",
    },
    VACATION: {
        bg: "bg-orange-100 dark:bg-orange-950",
        text: "text-orange-800 dark:text-orange-200",
        label: "Vacation",
    },
    SICK_LEAVE: {
        bg: "bg-red-100 dark:bg-red-950",
        text: "text-red-800 dark:text-red-200",
        label: "Sick Leave",
    },
    OTHER: {
        bg: "bg-gray-100 dark:bg-gray-800",
        text: "text-gray-800 dark:text-gray-200",
        label: "Other",
    },
}

export function ShiftLegend({}: ShiftLegendProps) {
    return (
        <div className="flex flex-wrap gap-3 p-4 bg-muted/30 rounded-md">
            <span className="text-sm font-medium text-muted-foreground mr-2">Legend:</span>
            {Object.entries(locationColors).map(([key, { bg, text, label }]) => (
                <Badge key={key} variant="outline" className={`${bg} ${text} border-0`}>
                    {label}
                </Badge>
            ))}
        </div>
    )
}

export { locationColors }
