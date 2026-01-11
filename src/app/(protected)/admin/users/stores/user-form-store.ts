import { create } from "zustand"
import { type UserRole } from "../schemas/user-action-schemas"

interface CreateFormState {
    data: {
        name: string
        email: string
        password: string
        role: UserRole
    }
    isLoading: boolean
    error: string
}

interface EditFormState {
    data: {
        id: string
        name: string | null
        role: UserRole
    } | null
    isLoading: boolean
    error: string
}

interface ChangePasswordFormState {
    data: {
        id: string
        newPassword: string
    } | null
    isLoading: boolean
    error: string
}

interface DeleteFormState {
    data: {
        id: string
    } | null
    isLoading: boolean
    error: string
}

interface DeactivateFormState {
    data: {
        id: string
    } | null
    isLoading: boolean
    error: string
}

interface ReactivateFormState {
    data: {
        id: string
    } | null
    isLoading: boolean
    error: string
}

interface AnonymizeFormState {
    data: {
        id: string
    } | null
    isLoading: boolean
    error: string
}

interface UserFormStoreState {
    createForm: CreateFormState
    editForm: EditFormState
    changePasswordForm: ChangePasswordFormState
    deleteForm: DeleteFormState
    deactivateForm: DeactivateFormState
    reactivateForm: ReactivateFormState
    anonymizeForm: AnonymizeFormState
}

interface UserFormStoreActions {
    setCreateFormData: (
        data: Partial<{
            name: string
            email: string
            password: string
            role: UserRole
        }>
    ) => void
    resetCreateForm: () => void
    setCreateLoading: (isLoading: boolean) => void
    setCreateError: (error: string) => void
    clearCreateError: () => void
    setEditFormData: (
        data: Partial<{
            id: string
            name: string | null
            role: UserRole
        }>
    ) => void
    initializeEditForm: (user: { id: string; name: string | null; role: UserRole }) => void
    resetEditForm: () => void
    setEditLoading: (isLoading: boolean) => void
    setEditError: (error: string) => void
    clearEditError: () => void
    setChangePasswordFormData: (
        data: Partial<{
            id: string
            newPassword: string
        }>
    ) => void
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
    setDeactivateFormData: (userId: string) => void
    resetDeactivateForm: () => void
    setDeactivateLoading: (isLoading: boolean) => void
    setDeactivateError: (error: string) => void
    clearDeactivateError: () => void
    setReactivateFormData: (userId: string) => void
    resetReactivateForm: () => void
    setReactivateLoading: (isLoading: boolean) => void
    setReactivateError: (error: string) => void
    clearReactivateError: () => void
    setAnonymizeFormData: (userId: string) => void
    resetAnonymizeForm: () => void
    setAnonymizeLoading: (isLoading: boolean) => void
    setAnonymizeError: (error: string) => void
    clearAnonymizeError: () => void
}

export const useUserFormStore = create<UserFormStoreState & UserFormStoreActions>((set) => ({
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
    deactivateForm: {
        data: null,
        isLoading: false,
        error: "",
    },
    reactivateForm: {
        data: null,
        isLoading: false,
        error: "",
    },
    anonymizeForm: {
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
    setDeactivateFormData: (userId) =>
        set({
            deactivateForm: {
                data: { id: userId },
                isLoading: false,
                error: "",
            },
        }),
    resetDeactivateForm: () =>
        set({
            deactivateForm: {
                data: null,
                isLoading: false,
                error: "",
            },
        }),
    setDeactivateLoading: (isLoading) =>
        set((state) => ({
            deactivateForm: { ...state.deactivateForm, isLoading },
        })),
    setDeactivateError: (error) =>
        set((state) => ({
            deactivateForm: { ...state.deactivateForm, error },
        })),
    clearDeactivateError: () =>
        set((state) => ({
            deactivateForm: { ...state.deactivateForm, error: "" },
        })),
    setReactivateFormData: (userId) =>
        set({
            reactivateForm: {
                data: { id: userId },
                isLoading: false,
                error: "",
            },
        }),
    resetReactivateForm: () =>
        set({
            reactivateForm: {
                data: null,
                isLoading: false,
                error: "",
            },
        }),
    setReactivateLoading: (isLoading) =>
        set((state) => ({
            reactivateForm: { ...state.reactivateForm, isLoading },
        })),
    setReactivateError: (error) =>
        set((state) => ({
            reactivateForm: { ...state.reactivateForm, error },
        })),
    clearReactivateError: () =>
        set((state) => ({
            reactivateForm: { ...state.reactivateForm, error: "" },
        })),
    setAnonymizeFormData: (userId) =>
        set({
            anonymizeForm: {
                data: { id: userId },
                isLoading: false,
                error: "",
            },
        }),
    resetAnonymizeForm: () =>
        set({
            anonymizeForm: {
                data: null,
                isLoading: false,
                error: "",
            },
        }),
    setAnonymizeLoading: (isLoading) =>
        set((state) => ({
            anonymizeForm: { ...state.anonymizeForm, isLoading },
        })),
    setAnonymizeError: (error) =>
        set((state) => ({
            anonymizeForm: { ...state.anonymizeForm, error },
        })),
    clearAnonymizeError: () =>
        set((state) => ({
            anonymizeForm: { ...state.anonymizeForm, error: "" },
        })),
}))
