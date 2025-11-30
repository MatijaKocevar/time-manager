import type { TaskDisplay, TaskTreeNode } from "../schemas/task-schemas"

export function buildTaskTree(tasks: TaskDisplay[]): TaskTreeNode[] {
    const taskMap = new Map<string, TaskTreeNode>()
    const rootTasks: TaskTreeNode[] = []

    tasks.forEach((task) => {
        taskMap.set(task.id, { ...task, subtasks: [], depth: 0 })
    })

    tasks.forEach((task) => {
        const node = taskMap.get(task.id)
        if (!node) return

        if (task.parentId) {
            const parent = taskMap.get(task.parentId)
            if (parent) {
                node.depth = parent.depth + 1
                parent.subtasks.push(node)
            } else {
                rootTasks.push(node)
            }
        } else {
            rootTasks.push(node)
        }
    })

    return rootTasks
}

export function flattenTaskTree(tree: TaskTreeNode[]): TaskTreeNode[] {
    const result: TaskTreeNode[] = []

    function traverse(nodes: TaskTreeNode[]) {
        nodes.forEach((node) => {
            result.push(node)
            if (node.subtasks.length > 0) {
                traverse(node.subtasks)
            }
        })
    }

    traverse(tree)
    return result
}

export function getDescendantIds(task: TaskTreeNode): string[] {
    const ids: string[] = [task.id]

    function collectIds(node: TaskTreeNode) {
        node.subtasks.forEach((subtask) => {
            ids.push(subtask.id)
            collectIds(subtask)
        })
    }

    collectIds(task)
    return ids
}

export function findTaskInTree(tree: TaskTreeNode[], taskId: string): TaskTreeNode | null {
    for (const node of tree) {
        if (node.id === taskId) {
            return node
        }
        if (node.subtasks.length > 0) {
            const found = findTaskInTree(node.subtasks, taskId)
            if (found) {
                return found
            }
        }
    }
    return null
}
