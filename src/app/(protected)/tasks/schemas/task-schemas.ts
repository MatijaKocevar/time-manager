import { z } from "zod"
import { TaskStatusSchema } from "./task-action-schemas"

export const TaskDisplaySchema = z.object({
    id: z.string(),
    userId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    status: TaskStatusSchema,
    parentId: z.string().nullable(),
    order: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
})

export type TaskDisplay = z.infer<typeof TaskDisplaySchema>

export interface TaskTreeNode extends TaskDisplay {
    subtasks: TaskTreeNode[]
    depth: number
}
