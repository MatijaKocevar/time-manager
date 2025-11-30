import { z } from "zod"

export const TaskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"])

const CreateTaskInputSchema = z.object({
    title: z.string().min(1, "Title is required").max(255, "Title is too long"),
    description: z.string().optional(),
    status: TaskStatusSchema.default("TODO"),
    parentId: z.string().optional(),
})

export const CreateTaskSchema = CreateTaskInputSchema

const UpdateTaskInputSchema = z.object({
    id: z.string(),
    title: z.string().min(1, "Title is required").max(255, "Title is too long").optional(),
    description: z.string().optional(),
    status: TaskStatusSchema.optional(),
    order: z.number().int().optional(),
})

export const UpdateTaskSchema = UpdateTaskInputSchema

export const DeleteTaskSchema = z.object({
    id: z.string(),
})

export const ToggleExpandedSchema = z.object({
    id: z.string(),
    isExpanded: z.boolean(),
})

export type TaskStatus = z.infer<typeof TaskStatusSchema>
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>
export type DeleteTaskInput = z.infer<typeof DeleteTaskSchema>
export type ToggleExpandedInput = z.infer<typeof ToggleExpandedSchema>
