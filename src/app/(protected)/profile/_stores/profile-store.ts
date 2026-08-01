import { create } from "zustand"
import { type ProfileFormState } from "../_schemas/profile-schemas"
import { DEFAULT_WORK_HOURS } from "../_constants/profile-constants"

interface ProfileStoreState {
    formData: ProfileFormState
    isLoading: boolean
    error: string
    deactivateForm: {
        isLoading: boolean
        error: string
    }
}

interface ProfileStoreActions {
    setFormData: (data: Partial<ProfileFormState>) => void
    initializeFormData: (data: ProfileFormState) => void
    resetFormData: (initialName: string) => void
    setLoading: (isLoading: boolean) => void
    setError: (error: string) => void
    clearError: () => void
    setDeactivateLoading: (isLoading: boolean) => void
    setDeactivateError: (error: string) => void
    clearDeactivateError: () => void
}

export const useProfileStore = create<ProfileStoreState & ProfileStoreActions>((set) => ({
    formData: {
        name: "",
        currentPassword: "",
        newPassword: "",
        workStartTime: DEFAULT_WORK_HOURS.START_TIME,
        workEndTime: DEFAULT_WORK_HOURS.END_TIME,
    },
    isLoading: false,
    error: "",
    deactivateForm: {
        isLoading: false,
        error: "",
    },
    setFormData: (data) =>
        set((state) => ({
            formData: { ...state.formData, ...data },
        })),
    initializeFormData: (data) =>
        set(() => ({
            formData: data,
        })),
    resetFormData: (initialName) =>
        set(() => ({
            formData: {
                name: initialName,
                currentPassword: "",
                newPassword: "",
                workStartTime: DEFAULT_WORK_HOURS.START_TIME,
                workEndTime: DEFAULT_WORK_HOURS.END_TIME,
            },
            error: "",
        })),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error, isLoading: false }),
    clearError: () => set({ error: "" }),
    setDeactivateLoading: (isLoading) =>
        set((state) => ({
            deactivateForm: { ...state.deactivateForm, isLoading },
        })),
    setDeactivateError: (error) =>
        set((_state) => ({
            deactivateForm: { isLoading: false, error },
        })),
    clearDeactivateError: () =>
        set((state) => ({
            deactivateForm: { ...state.deactivateForm, error: "" },
        })),
}))
