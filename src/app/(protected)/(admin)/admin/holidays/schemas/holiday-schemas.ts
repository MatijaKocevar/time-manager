import { z } from "zod"

export const CreateHolidaySchema = z.object({
    date: z.date(),
    name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
    description: z.string().max(500, "Description must be less than 500 characters").optional(),
    isRecurring: z.boolean().default(false),
})

export const UpdateHolidaySchema = z.object({
    id: z.string(),
    date: z.date(),
    name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
    description: z.string().max(500, "Description must be less than 500 characters").optional(),
    isRecurring: z.boolean().default(false),
})

export const DeleteHolidaySchema = z.object({
    id: z.string(),
})

export type CreateHolidayInput = z.infer<typeof CreateHolidaySchema>
export type UpdateHolidayInput = z.infer<typeof UpdateHolidaySchema>
export type DeleteHolidayInput = z.infer<typeof DeleteHolidaySchema>
