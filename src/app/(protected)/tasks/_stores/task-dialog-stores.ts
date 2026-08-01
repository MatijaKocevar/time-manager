import { create } from "zustand"
import type { TaskStatus } from "../_schemas"
import type { TaskTimeEntryDisplay } from "../_schemas/task-time-entry-schemas"
import { TASK_STATUS } from "../_constants/task-statuses"

interface CreateFormData {
    title: string
    description: string
    status: TaskStatus
}

interface TaskDialogState {
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
    descriptionDialog: {
        isOpen: boolean
        taskId: string | null
        taskTitle: string | null
    }
    descriptionForm: {
        isLoading: boolean
        error: string
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
            isPrivate: boolean
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
}

interface TaskDialogActions {
    openCreateDialog: (parentId?: string, listId?: string | null) => void
    closeCreateDialog: () => void
    openTimeEntriesDialog: (taskId: string) => void
    closeTimeEntriesDialog: () => void
    openEditTimeEntryDialog: (entry: TaskTimeEntryDisplay) => void
    closeEditTimeEntryDialog: () => void
    openDeleteDialog: (taskId: string) => void
    closeDeleteDialog: () => void
    openListDialog: (
        listId?: string,
        initialData?: { name: string; description: string; color: string; isPrivate: boolean }
    ) => void
    closeListDialog: () => void
    openMoveTaskDialog: (taskId: string) => void
    closeMoveTaskDialog: () => void
    openDescriptionDialog: (taskId: string, taskTitle: string) => void
    closeDescriptionDialog: () => void
    setDescriptionLoading: (isLoading: boolean) => void
    setDescriptionError: (error: string) => void
    setCreateFormData: (data: Partial<CreateFormData>) => void
    resetCreateForm: () => void
    setCreateLoading: (isLoading: boolean) => void
    setCreateError: (error: string) => void
    clearCreateError: () => void
    setListFormData: (
        data: Partial<{ name: string; description: string; color: string; isPrivate: boolean }>
    ) => void
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
}

const initialFormData: CreateFormData = {
    title: "",
    description: "",
    status: TASK_STATUS.TODO,
}

const DEFAULT_LIST_COLOR = "#3b82f6"

const initialListFormData = {
    name: "",
    description: "",
    color: DEFAULT_LIST_COLOR,
    isPrivate: false,
}

export const useTaskDialogStore = create<TaskDialogState & TaskDialogActions>((set) => ({
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
    descriptionDialog: {
        isOpen: false,
        taskId: null,
        taskTitle: null,
    },
    descriptionForm: {
        isLoading: false,
        error: "",
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

    openListDialog: (listId, initialData) =>
        set(() => ({
            listDialog: { isOpen: true, listId: listId || null },
            listForm: {
                data: initialData ?? initialListFormData,
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

    openDescriptionDialog: (taskId, taskTitle) =>
        set(() => ({
            descriptionDialog: { isOpen: true, taskId, taskTitle },
            descriptionForm: { isLoading: false, error: "" },
        })),
    closeDescriptionDialog: () =>
        set(() => ({
            descriptionDialog: { isOpen: false, taskId: null, taskTitle: null },
        })),
    setDescriptionLoading: (isLoading) =>
        set((state) => ({
            descriptionForm: { ...state.descriptionForm, isLoading },
        })),
    setDescriptionError: (error) =>
        set((state) => ({
            descriptionForm: { ...state.descriptionForm, error },
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
}))
