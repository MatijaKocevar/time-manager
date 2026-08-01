import { create } from "zustand"
import type { TaskStatus } from "../_schemas"
import { TASK_STATUS } from "../_constants/task-statuses"

interface ActiveTimer {
    taskId: string
    entryId: string
    startTime: Date
}

interface TasksStoreState {
    expandedRows: Set<string>
    expandedTasks: Set<string>
    expandedStatusSections: Map<string, Set<TaskStatus>>
    activeTimer: ActiveTimer | null
    elapsedSeconds: number
    selectedListId: string | null
    taskOperations: Map<string, { isLoading: boolean }>
    deletingListId: string | null
}

interface TasksStoreActions {
    toggleRow: (taskId: string) => void
    toggleTaskExpanded: (taskId: string) => void
    toggleStatusSection: (listId: string | null, status: TaskStatus) => void
    hydrateExpandedTasks: () => void
    expandAll: (taskIds: string[]) => void
    collapseAll: () => void
    setActiveTimer: (taskId: string, entryId: string, startTime: Date) => void
    clearActiveTimer: () => void
    updateElapsedTime: (seconds: number) => void
    setSelectedListId: (listId: string | null) => void
    setTaskOperationLoading: (taskId: string, isLoading: boolean) => void
    clearTaskOperationLoading: (taskId: string) => void
    setDeletingListId: (listId: string | null) => void
    deleteList: (listId: string, confirmMessage: string) => Promise<boolean>
}

const saveExpandedTasks = (expandedTasks: Set<string>) => {
    if (typeof window === "undefined") return
    try {
        localStorage.setItem("expandedTasks", JSON.stringify(Array.from(expandedTasks)))
    } catch {
        return
    }
}

const saveExpandedStatusSections = (expandedSections: Map<string, Set<TaskStatus>>) => {
    if (typeof window === "undefined") return
    try {
        const serialized = Array.from(expandedSections.entries()).map(([listId, statuses]) => [
            listId,
            Array.from(statuses),
        ])
        localStorage.setItem("expandedStatusSections", JSON.stringify(serialized))
    } catch {
        return
    }
}

const loadExpandedStatusSections = (): Map<string, Set<TaskStatus>> => {
    if (typeof window === "undefined") {
        return new Map()
    }
    try {
        const stored = localStorage.getItem("expandedStatusSections")
        if (stored) {
            const parsed = JSON.parse(stored) as [string, TaskStatus[]][]
            return new Map(parsed.map(([listId, statuses]) => [listId, new Set(statuses)]))
        }
    } catch {
        return new Map()
    }
    return new Map()
}

export const useTasksStore = create<TasksStoreState & TasksStoreActions>((set) => ({
    expandedRows: new Set<string>(),
    toggleRow: (taskId) =>
        set((state) => {
            const newExpanded = new Set(state.expandedRows)
            if (newExpanded.has(taskId)) {
                newExpanded.delete(taskId)
            } else {
                newExpanded.add(taskId)
            }
            return { expandedRows: newExpanded }
        }),
    expandAll: (taskIds) =>
        set(() => ({
            expandedRows: new Set(taskIds),
        })),
    collapseAll: () =>
        set(() => ({
            expandedRows: new Set(),
        })),

    expandedTasks: new Set<string>(),
    toggleTaskExpanded: (taskId) =>
        set((state) => {
            const newExpanded = new Set(state.expandedTasks)
            if (newExpanded.has(taskId)) {
                newExpanded.delete(taskId)
            } else {
                newExpanded.add(taskId)
            }
            saveExpandedTasks(newExpanded)
            return { expandedTasks: newExpanded }
        }),

    expandedStatusSections: loadExpandedStatusSections(),
    toggleStatusSection: (listId, status) =>
        set((state) => {
            const key = listId || "no-list"
            const newExpanded = new Map(state.expandedStatusSections)
            const currentStatuses =
                newExpanded.get(key) || new Set([TASK_STATUS.IN_PROGRESS, TASK_STATUS.TODO])
            const newStatuses = new Set(currentStatuses)

            if (newStatuses.has(status)) {
                newStatuses.delete(status)
            } else {
                newStatuses.add(status)
            }

            newExpanded.set(key, newStatuses)
            saveExpandedStatusSections(newExpanded)
            return { expandedStatusSections: newExpanded }
        }),

    hydrateExpandedTasks: () =>
        set(() => {
            if (typeof window === "undefined") return {}
            try {
                const stored = localStorage.getItem("expandedTasks")
                if (stored) {
                    return { expandedTasks: new Set(JSON.parse(stored)) }
                }
            } catch {
                return {}
            }
            return {}
        }),

    activeTimer: null,
    setActiveTimer: (taskId, entryId, startTime) =>
        set(() => ({
            activeTimer: { taskId, entryId, startTime },
            elapsedSeconds: 0,
        })),
    clearActiveTimer: () =>
        set(() => ({
            activeTimer: null,
            elapsedSeconds: 0,
        })),

    elapsedSeconds: 0,
    updateElapsedTime: (seconds) =>
        set(() => ({
            elapsedSeconds: seconds,
        })),

    selectedListId: null,
    setSelectedListId: (listId) => set(() => ({ selectedListId: listId })),

    taskOperations: new Map(),
    deletingListId: null,
    setTaskOperationLoading: (taskId, isLoading) =>
        set((state) => {
            const newOperations = new Map(state.taskOperations)
            if (isLoading) {
                newOperations.set(taskId, { isLoading: true })
            } else {
                newOperations.delete(taskId)
            }
            return { taskOperations: newOperations }
        }),
    clearTaskOperationLoading: (taskId) =>
        set((state) => {
            const newOperations = new Map(state.taskOperations)
            newOperations.delete(taskId)
            return { taskOperations: newOperations }
        }),

    setDeletingListId: (listId) => set(() => ({ deletingListId: listId })),

    deleteList: async (listId, confirmMessage) => {
        if (!confirm(confirmMessage)) {
            return false
        }

        set(() => ({ deletingListId: listId }))

        try {
            const { deleteList: deleteListAction } = await import("../_actions/list-actions")
            const result = await deleteListAction({ id: listId })

            if (result.success) {
                return true
            } else if (result.error) {
                alert(result.error)
                return false
            }
            return false
        } catch (error) {
            console.error("Failed to delete list:", error)
            alert("Failed to delete list")
            return false
        } finally {
            set(() => ({ deletingListId: null }))
        }
    },
}))
