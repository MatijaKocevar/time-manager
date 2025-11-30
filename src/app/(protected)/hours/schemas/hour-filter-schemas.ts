import { z } from "zod"
import { HourTypeSchema } from "./hour-action-schemas"

export const HourFilterSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    type: HourTypeSchema.optional(),
})

export const ViewModeSchema = z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])

export type HourFilter = z.infer<typeof HourFilterSchema>
export type ViewMode = z.infer<typeof ViewModeSchema>
