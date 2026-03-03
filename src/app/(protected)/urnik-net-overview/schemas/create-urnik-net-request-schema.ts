import { z } from "zod"

export const UrnikNetRequestTypeSchema = z.enum(["WORK", "WORK_FROM_HOME"])

export type UrnikNetRequestType = z.infer<typeof UrnikNetRequestTypeSchema>

export const CreateUrnikNetRequestSchema = z
    .object({
        type: UrnikNetRequestTypeSchema,
        date: z.date(),
        startTime: z
            .string()
            .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Start time must be in HH:mm format"),
        endTime: z
            .string()
            .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "End time must be in HH:mm format"),
        comment: z.string().optional(),
    })
    .refine(
        (data) => {
            const [startHour, startMin] = data.startTime.split(":").map(Number)
            const [endHour, endMin] = data.endTime.split(":").map(Number)
            const startMinutes = startHour * 60 + startMin
            const endMinutes = endHour * 60 + endMin
            return endMinutes > startMinutes
        },
        {
            message: "End time must be after start time",
            path: ["endTime"],
        }
    )

export type CreateUrnikNetRequestInput = z.infer<typeof CreateUrnikNetRequestSchema>
