import { z } from "zod"
import { HourTypeSchema } from "./hour-action-schemas"

export const HourEntryDisplaySchema = z.object({
    id: z.string(),
    userId: z.string(),
    date: z.date(),
    hours: z.number(),
    type: HourTypeSchema,
    description: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
})

export type HourEntryDisplay = z.infer<typeof HourEntryDisplaySchema>
