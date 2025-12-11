import { z } from "zod"

export const CreateListSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
    description: z.string().optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
    order: z.number().int().min(0).optional().default(0),
    isDefault: z.boolean().optional().default(false),
})

export const UpdateListSchema = z.object({
    id: z.string(),
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
    order: z.number().int().min(0).optional(),
})

export const DeleteListSchema = z.object({
    id: z.string(),
})

export const MoveTaskToListSchema = z.object({
    taskId: z.string(),
    listId: z.string().nullable(),
})

export type CreateListInput = z.input<typeof CreateListSchema>
export type UpdateListInput = z.infer<typeof UpdateListSchema>
export type DeleteListInput = z.infer<typeof DeleteListSchema>
export type MoveTaskToListInput = z.infer<typeof MoveTaskToListSchema>

export interface ListDisplay {
    id: string
    userId: string
    name: string
    description: string | null
    color: string | null
    icon: string | null
    order: number
    isDefault: boolean
    createdAt: Date
    updatedAt: Date
    taskCount?: number
}
