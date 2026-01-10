import { create } from "zustand"
import { type ProfileFormState } from "../schemas/profile-schemas"
import { DEFAULT_WORK_HOURS } from "../constants/profile-constants"

interface ProfileStoreState {
    formData: ProfileFormState
    isLoading: boolean
    error: string
    success: boolean
}

interface ProfileStoreActions {
    setFormData: (data: Partial<ProfileFormState>) => void
    initializeFormData: (data: ProfileFormState) => void
    resetFormData: (initialName: string) => void
    setLoading: (isLoading: boolean) => void
    setError: (error: string) => void
    clearError: () => void
    setSuccess: (success: boolean) => void
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
    success: false,
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
            success: false,
        })),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error, isLoading: false }),
    clearError: () => set({ error: "" }),
    setSuccess: (success) => set({ success }),
}))
