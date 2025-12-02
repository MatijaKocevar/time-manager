import { z } from "zod"

export const RequestTypeSchema = z.enum([
    "VACATION",
    "SICK_LEAVE",
    "WORK_FROM_HOME",
    "REMOTE_WORK",
    "OTHER",
])

export const RequestStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"])

const CreateRequestInputSchema = z.object({
    type: RequestTypeSchema,
    startDate: z.string(),
    endDate: z.string(),
    reason: z.string().optional(),
    location: z.string().optional(),
})

export const CreateRequestSchema = CreateRequestInputSchema.transform((data) => ({
    ...data,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    affectsHourType: data.type === "WORK_FROM_HOME" || data.type === "REMOTE_WORK",
}))

const UpdateRequestInputSchema = z.object({
    id: z.string(),
    type: RequestTypeSchema.optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    reason: z.string().optional(),
    location: z.string().optional(),
})

export const UpdateRequestSchema = UpdateRequestInputSchema.transform((data) => {
    const result: {
        id: string
        type?: z.infer<typeof RequestTypeSchema>
        startDate?: Date
        endDate?: Date
        reason?: string
        location?: string
        affectsHourType?: boolean
    } = { id: data.id }

    if (data.type !== undefined) {
        result.type = data.type
        result.affectsHourType = data.type === "WORK_FROM_HOME" || data.type === "REMOTE_WORK"
    }
    if (data.startDate !== undefined) result.startDate = new Date(data.startDate)
    if (data.endDate !== undefined) result.endDate = new Date(data.endDate)
    if (data.reason !== undefined) result.reason = data.reason
    if (data.location !== undefined) result.location = data.location

    return result
})

export const CancelRequestSchema = z.object({
    id: z.string(),
})

export const ApproveRequestSchema = z.object({
    id: z.string(),
})

export const RejectRequestSchema = z.object({
    id: z.string(),
    rejectionReason: z.string().optional(),
})

export const RequestDisplaySchema = z.object({
    id: z.string(),
    userId: z.string(),
    type: RequestTypeSchema,
    status: RequestStatusSchema,
    startDate: z.date(),
    endDate: z.date(),
    reason: z.string().nullable(),
    location: z.string().nullable(),
    affectsHourType: z.boolean(),
    approvedBy: z.string().nullable(),
    approvedAt: z.date().nullable(),
    rejectedBy: z.string().nullable(),
    rejectedAt: z.date().nullable(),
    rejectionReason: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    user: z
        .object({
            id: z.string(),
            name: z.string().nullable(),
            email: z.string(),
        })
        .optional(),
    approver: z
        .object({
            id: z.string(),
            name: z.string().nullable(),
            email: z.string(),
        })
        .nullable()
        .optional(),
    rejector: z
        .object({
            id: z.string(),
            name: z.string().nullable(),
            email: z.string(),
        })
        .nullable()
        .optional(),
})

export type RequestType = z.infer<typeof RequestTypeSchema>
export type RequestStatus = z.infer<typeof RequestStatusSchema>
export type CreateRequestInput = z.input<typeof CreateRequestSchema>
export type UpdateRequestInput = z.input<typeof UpdateRequestSchema>
export type CancelRequestInput = z.infer<typeof CancelRequestSchema>
export type ApproveRequestInput = z.infer<typeof ApproveRequestSchema>
export type RejectRequestInput = z.infer<typeof RejectRequestSchema>
export type RequestDisplay = z.infer<typeof RequestDisplaySchema>
