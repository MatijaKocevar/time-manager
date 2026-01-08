import { create } from "zustand"
import { type ProfileFormState } from "../schemas/profile-schemas"

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
        workStartTime: "08:00",
        workEndTime: "16:00",
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
                workStartTime: "08:00",
                workEndTime: "16:00",
            },
            error: "",
            success: false,
        })),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error, isLoading: false }),
    clearError: () => set({ error: "" }),
    setSuccess: (success) => set({ success }),
}))
