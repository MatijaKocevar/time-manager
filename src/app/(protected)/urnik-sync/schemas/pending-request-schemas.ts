import { z } from "zod"

export const PendingUrnikRequestSchema = z.object({
    date: z.date(),
    startTime: z.string(),
    endTime: z.string(),
    hours: z.number(),
    type: z.enum(["WORK", "WORK_FROM_HOME"]),
    isPending: z.literal(true),
})

export type PendingUrnikRequest = z.infer<typeof PendingUrnikRequestSchema>

export const GetPendingRequestsInputSchema = z.object({
    startDate: z.string(),
    endDate: z.string(),
})

export type GetPendingRequestsInput = z.infer<typeof GetPendingRequestsInputSchema>
