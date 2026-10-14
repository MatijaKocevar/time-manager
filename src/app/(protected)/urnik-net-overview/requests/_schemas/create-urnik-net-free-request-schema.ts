import { z } from "zod"

const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/

export const CreateUrnikNetFreeRequestSchema = z
    .object({
        date: z.date(),
        startTime: z.string().regex(timeRegex, "Start time must be in HH:mm format"),
        endTime: z.string().regex(timeRegex, "End time must be in HH:mm format"),
        comment: z.string().optional(),
    })
    .refine((data) => data.endTime > data.startTime, {
        message: "End time must be after start time",
        path: ["endTime"],
    })

export type CreateUrnikNetFreeRequestInput = z.infer<typeof CreateUrnikNetFreeRequestSchema>
