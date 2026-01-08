import { z } from "zod"

const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/

export const RequestTypeSchema = z.enum(["VACATION", "SICK_LEAVE", "WORK_FROM_HOME", "OTHER"])

export const RequestStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"])

const CreateRequestInputSchema = z
    .object({
        type: RequestTypeSchema,
        startDate: z.string(),
        endDate: z.string(),
        startTime: z.string().regex(timeRegex, "Time must be in HH:MM format").optional(),
        endTime: z.string().regex(timeRegex, "Time must be in HH:MM format").optional(),
        isFullDay: z.boolean().default(true),
        reason: z.string().optional(),
        location: z.string().optional(),
        skipWeekends: z.boolean().default(true),
        skipHolidays: z.boolean().default(true),
    })
    .refine(
        (data) => {
            if (!data.isFullDay) {
                return data.startTime !== undefined && data.endTime !== undefined
            }
            return true
        },
        {
            message: "Start time and end time are required for partial day requests",
            path: ["startTime"],
        }
    )
    .refine(
        (data) => {
            if (!data.isFullDay && data.startTime && data.endTime) {
                const start = new Date(data.startDate)
                const end = new Date(data.endDate)
                const isSameDay = start.toDateString() === end.toDateString()

                if (isSameDay) {
                    const [startHour, startMin] = data.startTime.split(":").map(Number)
                    const [endHour, endMin] = data.endTime.split(":").map(Number)
                    const startMinutes = startHour * 60 + startMin
                    const endMinutes = endHour * 60 + endMin
                    return startMinutes < endMinutes
                }
            }
            return true
        },
        {
            message: "End time must be after start time",
            path: ["endTime"],
        }
    )

export const CreateRequestSchema = CreateRequestInputSchema.transform((data) => {
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    let requestedHours: number | undefined

    if (!data.isFullDay && data.startTime && data.endTime) {
        const [startHour, startMin] = data.startTime.split(":").map(Number)
        const [endHour, endMin] = data.endTime.split(":").map(Number)

        const start = new Date(startDate)
        start.setHours(startHour, startMin, 0, 0)

        const end = new Date(endDate)
        end.setHours(endHour, endMin, 0, 0)

        const diffMs = end.getTime() - start.getTime()
        requestedHours = diffMs / (1000 * 60 * 60)
    }

    return {
        ...data,
        startDate,
        endDate,
        requestedHours,
        affectsHourType: true,
        skipWeekends: data.skipWeekends,
        skipHolidays: data.skipHolidays,
    }
})

const UpdateRequestInputSchema = z.object({
    id: z.string(),
    type: RequestTypeSchema.optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    startTime: z.string().regex(timeRegex, "Time must be in HH:MM format").optional(),
    endTime: z.string().regex(timeRegex, "Time must be in HH:MM format").optional(),
    isFullDay: z.boolean().optional(),
    reason: z.string().optional(),
    location: z.string().optional(),
})

export const UpdateRequestSchema = UpdateRequestInputSchema.transform((data) => {
    const result: {
        id: string
        type?: z.infer<typeof RequestTypeSchema>
        startDate?: Date
        endDate?: Date
        startTime?: string
        endTime?: string
        isFullDay?: boolean
        requestedHours?: number
        reason?: string
        location?: string
        affectsHourType?: boolean
    } = { id: data.id }

    if (data.type !== undefined) {
        result.type = data.type
        result.affectsHourType = true
    }
    if (data.startDate !== undefined) result.startDate = new Date(data.startDate)
    if (data.endDate !== undefined) result.endDate = new Date(data.endDate)
    if (data.startTime !== undefined) result.startTime = data.startTime
    if (data.endTime !== undefined) result.endTime = data.endTime
    if (data.isFullDay !== undefined) result.isFullDay = data.isFullDay
    if (data.reason !== undefined) result.reason = data.reason
    if (data.location !== undefined) result.location = data.location

    if (!data.isFullDay && data.startTime && data.endTime && data.startDate && data.endDate) {
        const [startHour, startMin] = data.startTime.split(":").map(Number)
        const [endHour, endMin] = data.endTime.split(":").map(Number)

        const start = new Date(data.startDate)
        start.setHours(startHour, startMin, 0, 0)

        const end = new Date(data.endDate)
        end.setHours(endHour, endMin, 0, 0)

        const diffMs = end.getTime() - start.getTime()
        result.requestedHours = diffMs / (1000 * 60 * 60)
    }

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

export const CancelApprovedRequestSchema = z.object({
    id: z.string(),
    cancellationReason: z.string().min(1, "Cancellation reason is required"),
})

export const RequestDisplaySchema = z.object({
    id: z.string(),
    userId: z.string(),
    type: RequestTypeSchema,
    status: RequestStatusSchema,
    startDate: z.date(),
    endDate: z.date(),
    startTime: z.string().nullable(),
    endTime: z.string().nullable(),
    isFullDay: z.boolean(),
    requestedHours: z.number().nullable(),
    reason: z.string().nullable(),
    location: z.string().nullable(),
    affectsHourType: z.boolean(),
    approvedBy: z.string().nullable(),
    approvedAt: z.date().nullable(),
    rejectedBy: z.string().nullable(),
    rejectedAt: z.date().nullable(),
    rejectionReason: z.string().nullable(),
    cancelledBy: z.string().nullable(),
    cancelledAt: z.date().nullable(),
    cancellationReason: z.string().nullable(),
    originalStartDate: z.date().nullable(),
    originalEndDate: z.date().nullable(),
    supersededBy: z.string().nullable(),
    trimmedBy: z.string().nullable(),
    splitFrom: z.string().nullable(),
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
    canceller: z
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
export type CancelApprovedRequestInput = z.infer<typeof CancelApprovedRequestSchema>
export type RequestDisplay = z.infer<typeof RequestDisplaySchema>
