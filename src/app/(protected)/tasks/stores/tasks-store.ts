import { create } from "zustand"
import type { TaskStatus } from "../schemas"

interface ActiveTimer {
    entryId: string
    startTime: Date
}

interface TasksStore {
    expandedRows: Set<string>
    toggleRow: (taskId: string) => void
    expandAll: (taskIds: string[]) => void
    collapseAll: () => void

    activeTimers: Map<string, ActiveTimer>
    setActiveTimer: (taskId: string, entryId: string, startTime: Date) => void
    clearActiveTimer: (taskId: string) => void

    elapsedTimes: Map<string, number>
    updateElapsedTime: (taskId: string, seconds: number) => void

    createDialog: {
        isOpen: boolean
        parentId: string | null
    }
    timeEntriesDialog: {
        isOpen: boolean
        taskId: string | null
    }
    deleteDialog: {
        isOpen: boolean
        taskId: string | null
    }

    createForm: {
        data: {
            title: string
            description: string
            status: TaskStatus
        }
        isLoading: boolean
        error: string
    }

    openCreateDialog: (parentId?: string) => void
    closeCreateDialog: () => void
    openTimeEntriesDialog: (taskId: string) => void
    closeTimeEntriesDialog: () => void
    openDeleteDialog: (taskId: string) => void
    closeDeleteDialog: () => void

    setCreateFormData: (data: Partial<TasksStore["createForm"]["data"]>) => void
    resetCreateForm: () => void
    setCreateLoading: (isLoading: boolean) => void
    setCreateError: (error: string) => void
    clearCreateError: () => void
}

const initialFormData = {
    title: "",
    description: "",
    status: "TODO" as TaskStatus,
}

export const useTasksStore = create<TasksStore>((set) => ({
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

    activeTimers: new Map(),
    setActiveTimer: (taskId, entryId, startTime) =>
        set((state) => {
            const newTimers = new Map(state.activeTimers)
            newTimers.set(taskId, { entryId, startTime })
            return { activeTimers: newTimers }
        }),
    clearActiveTimer: (taskId) =>
        set((state) => {
            const newTimers = new Map(state.activeTimers)
            newTimers.delete(taskId)
            const newElapsed = new Map(state.elapsedTimes)
            newElapsed.delete(taskId)
            return { activeTimers: newTimers, elapsedTimes: newElapsed }
        }),

    elapsedTimes: new Map(),
    updateElapsedTime: (taskId, seconds) =>
        set((state) => {
            const newElapsed = new Map(state.elapsedTimes)
            newElapsed.set(taskId, seconds)
            return { elapsedTimes: newElapsed }
        }),

    createDialog: {
        isOpen: false,
        parentId: null,
    },
    timeEntriesDialog: {
        isOpen: false,
        taskId: null,
    },
    deleteDialog: {
        isOpen: false,
        taskId: null,
    },

    createForm: {
        data: initialFormData,
        isLoading: false,
        error: "",
    },

    openCreateDialog: (parentId) =>
        set(() => ({
            createDialog: { isOpen: true, parentId: parentId || null },
            createForm: {
                data: initialFormData,
                isLoading: false,
                error: "",
            },
        })),
    closeCreateDialog: () =>
        set(() => ({
            createDialog: { isOpen: false, parentId: null },
        })),

    openTimeEntriesDialog: (taskId) =>
        set(() => ({
            timeEntriesDialog: { isOpen: true, taskId },
        })),
    closeTimeEntriesDialog: () =>
        set(() => ({
            timeEntriesDialog: { isOpen: false, taskId: null },
        })),

    openDeleteDialog: (taskId) =>
        set(() => ({
            deleteDialog: { isOpen: true, taskId },
        })),
    closeDeleteDialog: () =>
        set(() => ({
            deleteDialog: { isOpen: false, taskId: null },
        })),

    setCreateFormData: (data) =>
        set((state) => ({
            createForm: {
                ...state.createForm,
                data: { ...state.createForm.data, ...data },
            },
        })),
    resetCreateForm: () =>
        set((state) => ({
            createForm: {
                ...state.createForm,
                data: initialFormData,
                error: "",
            },
        })),
    setCreateLoading: (isLoading) =>
        set((state) => ({
            createForm: {
                ...state.createForm,
                isLoading,
            },
        })),
    setCreateError: (error) =>
        set((state) => ({
            createForm: {
                ...state.createForm,
                error,
            },
        })),
    clearCreateError: () =>
        set((state) => ({
            createForm: {
                ...state.createForm,
                error: "",
            },
        })),
}))
