import { create } from "zustand"
import { UserRole } from "@/types"

interface CreateFormData {
    name: string
    email: string
    password: string
    role: UserRole
}

interface EditFormData {
    id: string
    name: string | null
    role: UserRole
}

interface ChangePasswordFormData {
    id: string
    newPassword: string
}

interface DeleteFormData {
    id: string
}

interface UserFormStore {
    createForm: {
        data: CreateFormData
        isLoading: boolean
        error: string
    }
    editForm: {
        data: EditFormData | null
        isLoading: boolean
        error: string
    }
    changePasswordForm: {
        data: ChangePasswordFormData | null
        isLoading: boolean
        error: string
    }
    deleteForm: {
        data: DeleteFormData | null
        isLoading: boolean
        error: string
    }
    setCreateFormData: (data: Partial<CreateFormData>) => void
    resetCreateForm: () => void
    setCreateLoading: (isLoading: boolean) => void
    setCreateError: (error: string) => void
    clearCreateError: () => void
    setEditFormData: (data: Partial<EditFormData>) => void
    initializeEditForm: (user: EditFormData) => void
    resetEditForm: () => void
    setEditLoading: (isLoading: boolean) => void
    setEditError: (error: string) => void
    clearEditError: () => void
    setChangePasswordFormData: (data: Partial<ChangePasswordFormData>) => void
    initializeChangePasswordForm: (userId: string) => void
    resetChangePasswordForm: () => void
    setChangePasswordLoading: (isLoading: boolean) => void
    setChangePasswordError: (error: string) => void
    clearChangePasswordError: () => void
    setDeleteFormData: (userId: string) => void
    resetDeleteForm: () => void
    setDeleteLoading: (isLoading: boolean) => void
    setDeleteError: (error: string) => void
    clearDeleteError: () => void
}

export const useUserFormStore = create<UserFormStore>((set) => ({
    createForm: {
        data: {
            name: "",
            email: "",
            password: "",
            role: "USER",
        },
        isLoading: false,
        error: "",
    },
    editForm: {
        data: null,
        isLoading: false,
        error: "",
    },
    changePasswordForm: {
        data: null,
        isLoading: false,
        error: "",
    },
    deleteForm: {
        data: null,
        isLoading: false,
        error: "",
    },
    setCreateFormData: (data) =>
        set((state) => ({
            createForm: {
                ...state.createForm,
                data: { ...state.createForm.data, ...data },
            },
        })),
    resetCreateForm: () =>
        set({
            createForm: {
                data: { name: "", email: "", password: "", role: "USER" },
                isLoading: false,
                error: "",
            },
        }),
    setCreateLoading: (isLoading) =>
        set((state) => ({
            createForm: { ...state.createForm, isLoading },
        })),
    setCreateError: (error) =>
        set((state) => ({
            createForm: { ...state.createForm, error },
        })),
    clearCreateError: () =>
        set((state) => ({
            createForm: { ...state.createForm, error: "" },
        })),
    setEditFormData: (data) =>
        set((state) => ({
            editForm: {
                ...state.editForm,
                data: state.editForm.data ? { ...state.editForm.data, ...data } : null,
            },
        })),
    initializeEditForm: (user) =>
        set({
            editForm: {
                data: user,
                isLoading: false,
                error: "",
            },
        }),
    resetEditForm: () =>
        set({
            editForm: {
                data: null,
                isLoading: false,
                error: "",
            },
        }),
    setEditLoading: (isLoading) =>
        set((state) => ({
            editForm: { ...state.editForm, isLoading },
        })),
    setEditError: (error) =>
        set((state) => ({
            editForm: { ...state.editForm, error },
        })),
    clearEditError: () =>
        set((state) => ({
            editForm: { ...state.editForm, error: "" },
        })),
    setChangePasswordFormData: (data) =>
        set((state) => ({
            changePasswordForm: {
                ...state.changePasswordForm,
                data: state.changePasswordForm.data
                    ? { ...state.changePasswordForm.data, ...data }
                    : null,
            },
        })),
    initializeChangePasswordForm: (userId) =>
        set({
            changePasswordForm: {
                data: { id: userId, newPassword: "" },
                isLoading: false,
                error: "",
            },
        }),
    resetChangePasswordForm: () =>
        set({
            changePasswordForm: {
                data: null,
                isLoading: false,
                error: "",
            },
        }),
    setChangePasswordLoading: (isLoading) =>
        set((state) => ({
            changePasswordForm: { ...state.changePasswordForm, isLoading },
        })),
    setChangePasswordError: (error) =>
        set((state) => ({
            changePasswordForm: { ...state.changePasswordForm, error },
        })),
    clearChangePasswordError: () =>
        set((state) => ({
            changePasswordForm: { ...state.changePasswordForm, error: "" },
        })),
    setDeleteFormData: (userId) =>
        set({
            deleteForm: {
                data: { id: userId },
                isLoading: false,
                error: "",
            },
        }),
    resetDeleteForm: () =>
        set({
            deleteForm: {
                data: null,
                isLoading: false,
                error: "",
            },
        }),
    setDeleteLoading: (isLoading) =>
        set((state) => ({
            deleteForm: { ...state.deleteForm, isLoading },
        })),
    setDeleteError: (error) =>
        set((state) => ({
            deleteForm: { ...state.deleteForm, error },
        })),
    clearDeleteError: () =>
        set((state) => ({
            deleteForm: { ...state.deleteForm, error: "" },
        })),
}))
