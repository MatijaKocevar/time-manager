import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/server"
import {
    createTask,
    deleteTask,
    getTaskById,
    getTasks,
    updateTask,
    type TaskWithTime,
} from "@/app/(protected)/tasks/_actions/task-actions"
import {
    createList,
    deleteList,
    getLists,
    moveTaskToList,
    updateList,
} from "@/app/(protected)/tasks/_actions/list-actions"
import { getTaskTimeEntries } from "@/app/(protected)/tasks/_actions/task-time-actions"
import { errorResult, jsonResult, runTool } from "../lib/tool-helpers"

const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE", "ON_HOLD", "CANCELED"])

function toTaskSummary(task: TaskWithTime) {
    return {
        id: task.id,
        title: task.title,
        status: task.status,
        parentId: task.parentId,
        listId: task.listId,
        listName: task.listName,
        isSystemTask: task.isSystemTask,
        trackedSeconds: task.totalTime,
        updatedAt: task.updatedAt,
    }
}

function toListSummary(list: {
    id: string
    name: string
    description: string | null
    color: string | null
    icon: string | null
    order: number
    isDefault: boolean
    isPrivate: boolean
    taskCount?: number
}) {
    return {
        id: list.id,
        name: list.name,
        description: list.description,
        color: list.color,
        icon: list.icon,
        order: list.order,
        isDefault: list.isDefault,
        isPrivate: list.isPrivate,
        taskCount: list.taskCount,
    }
}

export function registerTaskTools(server: McpServer) {
    server.registerTool(
        "list_tasks",
        {
            title: "List tasks",
            description:
                "List the authenticated user's tasks with id, title, status, parent, list and tracked time (seconds). " +
                "Optionally filter by status or listId. System tasks (break, private, general work) are excluded unless includeSystemTasks is true.",
            inputSchema: z.object({
                status: taskStatusSchema.optional().describe("Filter by task status"),
                listId: z
                    .string()
                    .optional()
                    .describe("Filter by list id. Use list_task_lists to see available lists."),
                includeSystemTasks: z
                    .boolean()
                    .optional()
                    .describe("Include system-generated tasks (default false)"),
            }),
        },
        async ({ status, listId, includeSystemTasks }, ctx) =>
            runTool(ctx, async () => {
                const tasks = await getTasks({ status, listId })
                const filtered = includeSystemTasks
                    ? tasks
                    : tasks.filter((task) => !task.isSystemTask)

                return jsonResult(filtered.map(toTaskSummary))
            })
    )

    server.registerTool(
        "get_task",
        {
            title: "Get task",
            description:
                "Get a single task by id with description, tracked time (own and subtasks) and recent time entries.",
            inputSchema: z.object({
                id: z.string().describe("Task id"),
            }),
        },
        async ({ id }, ctx) =>
            runTool(ctx, async () => {
                const task = await getTaskById(id)

                if (!task) {
                    return errorResult(`Task not found: ${id}`)
                }

                const { entries, childAggregation } = await getTaskTimeEntries(id)
                const subtaskSeconds = childAggregation?.aggregatedDuration ?? 0

                return jsonResult({
                    ...toTaskSummary(task),
                    description: task.description,
                    trackedSeconds: task.totalTime + subtaskSeconds,
                    directTrackedSeconds: task.totalTime,
                    subtaskTrackedSeconds: subtaskSeconds,
                    timeEntries: entries.map((entry) => ({
                        id: entry.id,
                        taskTitle: entry.task.title,
                        startTime: entry.startTime,
                        endTime: entry.endTime,
                        durationSeconds: entry.duration,
                        type: entry.type,
                    })),
                })
            })
    )

    server.registerTool(
        "create_task",
        {
            title: "Create task",
            description:
                "Create a task. Use list_task_lists to find a listId and list_tasks to find a parentId for subtasks.",
            inputSchema: z.object({
                title: z.string().min(1).max(255).describe("Task title"),
                description: z.string().optional().describe("Optional description"),
                status: taskStatusSchema.optional().describe("Initial status (default TODO)"),
                parentId: z.string().optional().describe("Parent task id to create a subtask"),
                listId: z
                    .string()
                    .nullable()
                    .optional()
                    .describe("List id. Inherited from the parent task when omitted."),
            }),
        },
        async ({ title, description, status, parentId, listId }, ctx) =>
            runTool(ctx, async () => {
                const result = await createTask({
                    title,
                    description,
                    status: status ?? "TODO",
                    parentId,
                    listId,
                })

                if (result.error) {
                    return errorResult(result.error)
                }

                return jsonResult(result)
            })
    )

    server.registerTool(
        "update_task",
        {
            title: "Update task",
            description: "Update a task's title, description, status or sort order.",
            inputSchema: z.object({
                id: z.string().describe("Task id"),
                title: z.string().min(1).max(255).optional(),
                description: z.string().optional(),
                status: taskStatusSchema.optional(),
                order: z.number().int().optional().describe("Sort order within the list"),
            }),
        },
        async ({ id, title, description, status, order }, ctx) =>
            runTool(ctx, async () => {
                const result = await updateTask({ id, title, description, status, order })

                if (result.error) {
                    return errorResult(result.error)
                }

                return jsonResult(result)
            })
    )

    server.registerTool(
        "delete_task",
        {
            title: "Delete task",
            description:
                "Delete a task and its subtasks. System-generated tasks cannot be deleted.",
            inputSchema: z.object({
                id: z.string().describe("Task id"),
            }),
        },
        async ({ id }, ctx) =>
            runTool(ctx, async () => {
                const result = await deleteTask({ id })

                if (result.error) {
                    return errorResult(result.error)
                }

                return jsonResult(result)
            })
    )

    server.registerTool(
        "list_task_lists",
        {
            title: "List task lists",
            description:
                "List the authenticated user's task lists with id, name, description, color, icon, order, " +
                "privacy and task count.",
        },
        async (ctx) => runTool(ctx, async () => jsonResult((await getLists()).map(toListSummary)))
    )

    server.registerTool(
        "create_task_list",
        {
            title: "Create task list",
            description:
                "Create a task list (project) for the authenticated user. The name must be unique; the new " +
                "list id can be used with create_task and move_task_to_list.",
            inputSchema: z.object({
                name: z.string().min(1).max(100).describe("Unique list name"),
                description: z.string().optional(),
                color: z.string().optional().describe("Color as hex, e.g. #3b82f6"),
                icon: z.string().optional().describe("Icon identifier"),
                order: z.number().int().min(0).optional().describe("Sort order (default 0)"),
                isDefault: z
                    .boolean()
                    .optional()
                    .describe("Mark as the user's default list (default false)"),
                isPrivate: z.boolean().optional().describe("Private list (default false)"),
            }),
        },
        async (input, ctx) =>
            runTool(ctx, async () => {
                const result = await createList(input)

                if (result.error) {
                    return errorResult(result.error)
                }

                const list = result.list

                if (!list) {
                    return errorResult("Failed to create list")
                }

                return jsonResult(toListSummary(list))
            })
    )

    server.registerTool(
        "update_task_list",
        {
            title: "Update task list",
            description:
                "Update a task list's name, description, color, icon, sort order or privacy. The name must " +
                "stay unique; the default flag cannot be changed here.",
            inputSchema: z.object({
                id: z.string().describe("List id"),
                name: z.string().min(1).max(100).optional(),
                description: z.string().optional(),
                color: z.string().optional().describe("Color as hex, e.g. #3b82f6"),
                icon: z.string().optional().describe("Icon identifier"),
                order: z.number().int().min(0).optional(),
                isPrivate: z.boolean().optional(),
            }),
        },
        async (input, ctx) =>
            runTool(ctx, async () => {
                const result = await updateList(input)

                if (result.error) {
                    return errorResult(result.error)
                }

                const list = result.list

                if (!list) {
                    return errorResult("Failed to update list")
                }

                return jsonResult(toListSummary(list))
            })
    )

    server.registerTool(
        "delete_task_list",
        {
            title: "Delete task list",
            description:
                "Delete a task list. The default list cannot be deleted; tasks in the list are moved to the " +
                "default list.",
            inputSchema: z.object({
                id: z.string().describe("List id"),
            }),
        },
        async ({ id }, ctx) =>
            runTool(ctx, async () => {
                const result = await deleteList({ id })

                if (result.error) {
                    return errorResult(result.error)
                }

                return jsonResult({ success: true, id })
            })
    )

    server.registerTool(
        "move_task_to_list",
        {
            title: "Move task to list",
            description:
                "Move a task and its subtasks to another task list, or remove them from any list with listId null.",
            inputSchema: z.object({
                taskId: z.string().describe("Task id"),
                listId: z
                    .string()
                    .nullable()
                    .describe("Target list id, or null to remove the task from any list"),
            }),
        },
        async ({ taskId, listId }, ctx) =>
            runTool(ctx, async () => {
                const result = await moveTaskToList({ taskId, listId })

                if (result.error) {
                    return errorResult(result.error)
                }

                return jsonResult({ success: true, taskId, listId })
            })
    )
}
