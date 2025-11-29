import { create } from "zustand"
import { User } from "@/types"
import {
    CreateUserState,
    EditUserState,
    ChangePasswordState,
    DeleteUserState,
} from "../schemas/user-dialog-schemas"

interface UserDialogStore {
    createDialog: {
        isOpen: boolean
        data: CreateUserState
        isLoading: boolean
        error: string
    }
    editDialog: {
        isOpen: boolean
        data: EditUserState | null
        isLoading: boolean
        error: string
    }
    changePasswordDialog: {
        isOpen: boolean
        data: ChangePasswordState | null
        isLoading: boolean
        error: string
    }
    deleteDialog: {
        isOpen: boolean
        data: DeleteUserState | null
        isLoading: boolean
        error: string
    }
    openCreateDialog: () => void
    closeCreateDialog: () => void
    setCreateDialogData: (data: Partial<CreateUserState>) => void
    resetCreateDialogData: () => void
    setCreateLoading: (isLoading: boolean) => void
    setCreateError: (error: string) => void
    clearCreateError: () => void
    openEditDialog: (user: Pick<User, "id" | "name" | "role">) => void
    closeEditDialog: () => void
    setEditDialogData: (data: Partial<EditUserState>) => void
    setEditLoading: (isLoading: boolean) => void
    setEditError: (error: string) => void
    clearEditError: () => void
    openChangePasswordDialog: (userId: string) => void
    closeChangePasswordDialog: () => void
    setChangePasswordData: (data: Partial<ChangePasswordState>) => void
    setChangePasswordLoading: (isLoading: boolean) => void
    setChangePasswordError: (error: string) => void
    clearChangePasswordError: () => void
    openDeleteDialog: (user: Pick<User, "id" | "name">) => void
    closeDeleteDialog: () => void
    setDeleteLoading: (isLoading: boolean) => void
    setDeleteError: (error: string) => void
    clearDeleteError: () => void
}

const initialCreateState: CreateUserState = {
    name: "",
    email: "",
    password: "",
    role: "USER",
}

export const useUserDialogStore = create<UserDialogStore>((set) => ({
    createDialog: {
        isOpen: false,
        data: initialCreateState,
        isLoading: false,
        error: "",
    },
    editDialog: {
        isOpen: false,
        data: null,
        isLoading: false,
        error: "",
    },
    changePasswordDialog: {
        isOpen: false,
        data: null,
        isLoading: false,
        error: "",
    },
    deleteDialog: {
        isOpen: false,
        data: null,
        isLoading: false,
        error: "",
    },
    openCreateDialog: () =>
        set((state) => ({
            createDialog: { ...state.createDialog, isOpen: true, error: "" },
        })),
    closeCreateDialog: () =>
        set((state) => ({
            createDialog: { ...state.createDialog, isOpen: false, error: "" },
        })),
    setCreateDialogData: (data) =>
        set((state) => ({
            createDialog: {
                ...state.createDialog,
                data: { ...state.createDialog.data, ...data },
            },
        })),
    resetCreateDialogData: () =>
        set((state) => ({
            createDialog: {
                ...state.createDialog,
                data: initialCreateState,
                error: "",
            },
        })),
    setCreateLoading: (isLoading) =>
        set((state) => ({
            createDialog: { ...state.createDialog, isLoading },
        })),
    setCreateError: (error) =>
        set((state) => ({
            createDialog: { ...state.createDialog, error, isLoading: false },
        })),
    clearCreateError: () =>
        set((state) => ({
            createDialog: { ...state.createDialog, error: "" },
        })),
    openEditDialog: (user) =>
        set((state) => ({
            editDialog: {
                ...state.editDialog,
                isOpen: true,
                data: {
                    id: user.id,
                    name: user.name || "",
                    role: user.role,
                },
                error: "",
            },
        })),
    closeEditDialog: () =>
        set((state) => ({
            editDialog: {
                ...state.editDialog,
                isOpen: false,
                data: null,
                error: "",
            },
        })),
    setEditDialogData: (data) =>
        set((state) => ({
            editDialog: {
                ...state.editDialog,
                data: state.editDialog.data ? { ...state.editDialog.data, ...data } : null,
            },
        })),
    setEditLoading: (isLoading) =>
        set((state) => ({
            editDialog: { ...state.editDialog, isLoading },
        })),
    setEditError: (error) =>
        set((state) => ({
            editDialog: { ...state.editDialog, error, isLoading: false },
        })),
    clearEditError: () =>
        set((state) => ({
            editDialog: { ...state.editDialog, error: "" },
        })),
    openChangePasswordDialog: (userId) =>
        set((state) => ({
            changePasswordDialog: {
                ...state.changePasswordDialog,
                isOpen: true,
                data: {
                    id: userId,
                    newPassword: "",
                },
                error: "",
            },
        })),
    closeChangePasswordDialog: () =>
        set((state) => ({
            changePasswordDialog: {
                ...state.changePasswordDialog,
                isOpen: false,
                data: null,
                error: "",
            },
        })),
    setChangePasswordData: (data) =>
        set((state) => ({
            changePasswordDialog: {
                ...state.changePasswordDialog,
                data: state.changePasswordDialog.data
                    ? { ...state.changePasswordDialog.data, ...data }
                    : null,
            },
        })),
    setChangePasswordLoading: (isLoading) =>
        set((state) => ({
            changePasswordDialog: { ...state.changePasswordDialog, isLoading },
        })),
    setChangePasswordError: (error) =>
        set((state) => ({
            changePasswordDialog: {
                ...state.changePasswordDialog,
                error,
                isLoading: false,
            },
        })),
    clearChangePasswordError: () =>
        set((state) => ({
            changePasswordDialog: { ...state.changePasswordDialog, error: "" },
        })),
    openDeleteDialog: (user) =>
        set((state) => ({
            deleteDialog: {
                ...state.deleteDialog,
                isOpen: true,
                data: {
                    id: user.id,
                    name: user.name || "User",
                },
                error: "",
            },
        })),
    closeDeleteDialog: () =>
        set((state) => ({
            deleteDialog: {
                ...state.deleteDialog,
                isOpen: false,
                data: null,
                error: "",
            },
        })),
    setDeleteLoading: (isLoading) =>
        set((state) => ({
            deleteDialog: { ...state.deleteDialog, isLoading },
        })),
    setDeleteError: (error) =>
        set((state) => ({
            deleteDialog: { ...state.deleteDialog, error, isLoading: false },
        })),
    clearDeleteError: () =>
        set((state) => ({
            deleteDialog: { ...state.deleteDialog, error: "" },
        })),
}))
