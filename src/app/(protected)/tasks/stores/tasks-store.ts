import { create } from "zustand"
import type { TaskStatus } from "../schemas"
import type { TaskTimeEntryDisplay } from "../schemas/task-time-entry-schemas"
import { TASK_STATUS } from "../constants/task-statuses"

interface ActiveTimer {
    entryId: string
    startTime: Date
}

interface CreateFormData {
    title: string
    description: string
    status: TaskStatus
}

interface TasksStoreState {
    expandedRows: Set<string>
    expandedTasks: Set<string>
    expandedStatusSections: Map<string, Set<TaskStatus>>
    activeTimers: Map<string, ActiveTimer>
    elapsedTimes: Map<string, number>
    selectedListId: string | null
    createDialog: {
        isOpen: boolean
        parentId: string | null
        listId: string | null
    }
    timeEntriesDialog: {
        isOpen: boolean
        taskId: string | null
    }
    editTimeEntryDialog: {
        isOpen: boolean
        entry: TaskTimeEntryDisplay | null
    }
    deleteDialog: {
        isOpen: boolean
        taskId: string | null
    }
    listDialog: {
        isOpen: boolean
        listId: string | null
    }
    moveTaskDialog: {
        isOpen: boolean
        taskId: string | null
    }
    createForm: {
        data: CreateFormData
        isLoading: boolean
        error: string
    }
    listForm: {
        data: {
            name: string
            description: string
            color: string
        }
        isLoading: boolean
        error: string
    }
    deleteTaskForm: {
        isLoading: boolean
        error: string
    }
    moveTaskForm: {
        selectedListId: string
        isLoading: boolean
        error: string
    }
    taskOperations: Map<string, { isLoading: boolean }>
}

interface TasksStoreActions {
    toggleRow: (taskId: string) => void
    toggleTaskExpanded: (taskId: string) => void
    toggleStatusSection: (listId: string | null, status: TaskStatus) => void
    hydrateExpandedTasks: () => void
    expandAll: (taskIds: string[]) => void
    collapseAll: () => void
    setActiveTimer: (taskId: string, entryId: string, startTime: Date) => void
    clearActiveTimer: (taskId: string) => void
    clearAllActiveTimers: () => void
    updateElapsedTime: (taskId: string, seconds: number) => void
    syncActiveTimerFromServer: (
        serverTimer: { taskId: string; id: string; startTime: Date; endTime: Date | null } | null,
        activeTimers: Map<string, ActiveTimer>,
        clearAll: () => void,
        setTimer: (taskId: string, entryId: string, startTime: Date) => void
    ) => void
    setSelectedListId: (listId: string | null) => void
    openCreateDialog: (parentId?: string, listId?: string | null) => void
    closeCreateDialog: () => void
    openTimeEntriesDialog: (taskId: string) => void
    closeTimeEntriesDialog: () => void
    openEditTimeEntryDialog: (entry: TaskTimeEntryDisplay) => void
    closeEditTimeEntryDialog: () => void
    openDeleteDialog: (taskId: string) => void
    closeDeleteDialog: () => void
    openListDialog: (listId?: string) => void
    closeListDialog: () => void
    openMoveTaskDialog: (taskId: string) => void
    closeMoveTaskDialog: () => void
    setCreateFormData: (data: Partial<CreateFormData>) => void
    resetCreateForm: () => void
    setCreateLoading: (isLoading: boolean) => void
    setCreateError: (error: string) => void
    clearCreateError: () => void
    setListFormData: (data: Partial<{ name: string; description: string; color: string }>) => void
    resetListForm: () => void
    setListLoading: (isLoading: boolean) => void
    setListError: (error: string) => void
    clearListError: () => void
    setDeleteTaskLoading: (isLoading: boolean) => void
    setDeleteTaskError: (error: string) => void
    clearDeleteTaskError: () => void
    setMoveTaskSelectedListId: (listId: string) => void
    setMoveTaskLoading: (isLoading: boolean) => void
    setMoveTaskError: (error: string) => void
    clearMoveTaskError: () => void
    resetMoveTaskForm: () => void
    setTaskOperationLoading: (taskId: string, isLoading: boolean) => void
    clearTaskOperationLoading: (taskId: string) => void
}

const initialFormData: CreateFormData = {
    title: "",
    description: "",
    status: TASK_STATUS.TODO,
}

const initialListFormData = {
    name: "",
    description: "",
    color: "",
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
    clearAllActiveTimers: () =>
        set(() => ({
            activeTimers: new Map(),
            elapsedTimes: new Map(),
        })),

    elapsedTimes: new Map(),
    updateElapsedTime: (taskId, seconds) =>
        set((state) => {
            const newElapsed = new Map(state.elapsedTimes)
            newElapsed.set(taskId, seconds)
            return { elapsedTimes: newElapsed }
        }),
    syncActiveTimerFromServer: (serverTimer, activeTimers, clearAll, setTimer) => {
        if (serverTimer && serverTimer.endTime === null) {
            const currentTimer = activeTimers.get(serverTimer.taskId)

            if (!currentTimer || currentTimer.entryId !== serverTimer.id) {
                clearAll()
                setTimer(serverTimer.taskId, serverTimer.id, serverTimer.startTime)
            }
        } else if (!serverTimer && activeTimers.size > 0) {
            clearAll()
        }
    },

    selectedListId: null,
    setSelectedListId: (listId) => set(() => ({ selectedListId: listId })),

    createDialog: {
        isOpen: false,
        parentId: null,
        listId: null,
    },
    timeEntriesDialog: {
        isOpen: false,
        taskId: null,
    },
    editTimeEntryDialog: {
        isOpen: false,
        entry: null,
    },
    deleteDialog: {
        isOpen: false,
        taskId: null,
    },
    listDialog: {
        isOpen: false,
        listId: null,
    },
    moveTaskDialog: {
        isOpen: false,
        taskId: null,
    },

    createForm: {
        data: initialFormData,
        isLoading: false,
        error: "",
    },
    listForm: {
        data: initialListFormData,
        isLoading: false,
        error: "",
    },
    deleteTaskForm: {
        isLoading: false,
        error: "",
    },
    moveTaskForm: {
        selectedListId: "",
        isLoading: false,
        error: "",
    },
    taskOperations: new Map(),

    openCreateDialog: (parentId, listId) =>
        set(() => ({
            createDialog: { isOpen: true, parentId: parentId || null, listId: listId ?? null },
            createForm: {
                data: initialFormData,
                isLoading: false,
                error: "",
            },
        })),
    closeCreateDialog: () =>
        set(() => ({
            createDialog: { isOpen: false, parentId: null, listId: null },
        })),

    openTimeEntriesDialog: (taskId) =>
        set(() => ({
            timeEntriesDialog: { isOpen: true, taskId },
        })),
    closeTimeEntriesDialog: () =>
        set(() => ({
            timeEntriesDialog: { isOpen: false, taskId: null },
        })),

    openEditTimeEntryDialog: (entry) =>
        set(() => ({
            editTimeEntryDialog: { isOpen: true, entry },
        })),
    closeEditTimeEntryDialog: () =>
        set(() => ({
            editTimeEntryDialog: { isOpen: false, entry: null },
        })),

    openDeleteDialog: (taskId) =>
        set(() => ({
            deleteDialog: { isOpen: true, taskId },
        })),
    closeDeleteDialog: () =>
        set(() => ({
            deleteDialog: { isOpen: false, taskId: null },
        })),

    openListDialog: (listId) =>
        set(() => ({
            listDialog: { isOpen: true, listId: listId || null },
            listForm: {
                data: initialListFormData,
                isLoading: false,
                error: "",
            },
        })),
    closeListDialog: () =>
        set(() => ({
            listDialog: { isOpen: false, listId: null },
        })),

    openMoveTaskDialog: (taskId) =>
        set(() => ({
            moveTaskDialog: { isOpen: true, taskId },
        })),
    closeMoveTaskDialog: () =>
        set(() => ({
            moveTaskDialog: { isOpen: false, taskId: null },
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

    setListFormData: (data) =>
        set((state) => ({
            listForm: {
                ...state.listForm,
                data: { ...state.listForm.data, ...data },
            },
        })),
    resetListForm: () =>
        set((state) => ({
            listForm: {
                ...state.listForm,
                data: initialListFormData,
                error: "",
            },
        })),
    setListLoading: (isLoading) =>
        set((state) => ({
            listForm: {
                ...state.listForm,
                isLoading,
            },
        })),
    setListError: (error) =>
        set((state) => ({
            listForm: {
                ...state.listForm,
                error,
            },
        })),
    clearListError: () =>
        set((state) => ({
            listForm: {
                ...state.listForm,
                error: "",
            },
        })),

    setDeleteTaskLoading: (isLoading) =>
        set((state) => ({
            deleteTaskForm: {
                ...state.deleteTaskForm,
                isLoading,
            },
        })),
    setDeleteTaskError: (error) =>
        set((state) => ({
            deleteTaskForm: {
                ...state.deleteTaskForm,
                error,
            },
        })),
    clearDeleteTaskError: () =>
        set((state) => ({
            deleteTaskForm: {
                ...state.deleteTaskForm,
                error: "",
            },
        })),

    setMoveTaskSelectedListId: (listId) =>
        set((state) => ({
            moveTaskForm: {
                ...state.moveTaskForm,
                selectedListId: listId,
            },
        })),
    setMoveTaskLoading: (isLoading) =>
        set((state) => ({
            moveTaskForm: {
                ...state.moveTaskForm,
                isLoading,
            },
        })),
    setMoveTaskError: (error) =>
        set((state) => ({
            moveTaskForm: {
                ...state.moveTaskForm,
                error,
            },
        })),
    clearMoveTaskError: () =>
        set((state) => ({
            moveTaskForm: {
                ...state.moveTaskForm,
                error: "",
            },
        })),
    resetMoveTaskForm: () =>
        set(() => ({
            moveTaskForm: {
                selectedListId: "",
                isLoading: false,
                error: "",
            },
        })),

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
}))
