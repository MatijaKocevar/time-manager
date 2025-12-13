import { z } from "zod"
import { TaskStatusSchema } from "./task-action-schemas"

export const TasksFilterSchema = z.object({
    listId: z.string().nullable().optional(),
    status: TaskStatusSchema.optional(),
})

export type TasksFilter = z.infer<typeof TasksFilterSchema>

export const TaskDisplaySchema = z.object({
    id: z.string(),
    userId: z.string(),
    listId: z.string().nullable(),
    title: z.string(),
    description: z.string().nullable(),
    status: TaskStatusSchema,
    parentId: z.string().nullable(),
    order: z.number(),
    isExpanded: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
})

export type TaskDisplay = z.infer<typeof TaskDisplaySchema>

export const TaskTreeNodeSchema: z.ZodType<TaskTreeNode> = TaskDisplaySchema.extend({
    subtasks: z.lazy(() => z.array(TaskTreeNodeSchema)),
    depth: z.number(),
    totalTime: z.number().optional(),
})

export type TaskTreeNode = TaskDisplay & {
    subtasks: TaskTreeNode[]
    depth: number
    totalTime?: number
}
