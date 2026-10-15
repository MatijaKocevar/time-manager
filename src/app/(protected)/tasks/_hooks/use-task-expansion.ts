"use client"

import { toggleTaskExpanded } from "../_actions/task-actions"
import { useTasksStore } from "../_stores/tasks-store"
import type { TaskTreeNode } from "../_schemas"

const PERSIST_DELAY_MS = 400

const pendingWrites = new Map<string, ReturnType<typeof setTimeout>>()

function persistExpansion(taskId: string, isExpanded: boolean) {
    const pending = pendingWrites.get(taskId)

    if (pending) {
        clearTimeout(pending)
    }

    pendingWrites.set(
        taskId,
        setTimeout(() => {
            pendingWrites.delete(taskId)
            void toggleTaskExpanded({ id: taskId, isExpanded }).catch(() => {})
        }, PERSIST_DELAY_MS)
    )
}

export function useTaskExpansion(task: TaskTreeNode) {
    const isExpanded = useTasksStore(
        (state) => state.expansionOverrides.get(task.id) ?? task.isExpanded
    )
    const setTaskExpansion = useTasksStore((state) => state.setTaskExpansion)

    function setExpansion(next: boolean) {
        if (next === isExpanded) return

        setTaskExpansion(task.id, next)
        persistExpansion(task.id, next)
    }

    function toggleExpansion() {
        if (task.subtasks.length === 0) return

        setExpansion(!isExpanded)
    }

    function expand() {
        setExpansion(true)
    }

    return { isExpanded, toggleExpansion, expand }
}
