import { z } from "zod"

export const UrnikDayRequestTypeSchema = z.enum(["VACATION", "SICK_LEAVE", "WORK_FROM_HOME"])

export type UrnikDayRequestType = z.infer<typeof UrnikDayRequestTypeSchema>

export const CreateUrnikNetDayRequestSchema = z
    .object({
        type: UrnikDayRequestTypeSchema,
        startDate: z.date(),
        endDate: z.date(),
        comment: z.string().optional(),
    })
    .refine((data) => data.endDate >= data.startDate, {
        message: "End date must be on or after start date",
        path: ["endDate"],
    })

export type CreateUrnikNetDayRequestInput = z.infer<typeof CreateUrnikNetDayRequestSchema>
