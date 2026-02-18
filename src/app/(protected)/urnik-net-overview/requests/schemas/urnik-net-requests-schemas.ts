import { z } from "zod"

export const PendingUrnikNetRequestSchema = z.object({
    date: z.date(),
    startTime: z.string(),
    endTime: z.string(),
    hours: z.number(),
    type: z.enum(["WORK", "WORK_FROM_HOME"]),
    isPending: z.literal(true),
})

export type PendingUrnikNetRequest = z.infer<typeof PendingUrnikNetRequestSchema>

export const GetPendingUrnikNetRequestsInputSchema = z.object({
    startDate: z.string(),
    endDate: z.string(),
})

export type GetPendingUrnikNetRequestsInput = z.infer<typeof GetPendingUrnikNetRequestsInputSchema>
