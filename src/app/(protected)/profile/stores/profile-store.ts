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
    },
    isLoading: false,
    error: "",
    success: false,
    setFormData: (data) =>
        set((state) => ({
            formData: { ...state.formData, ...data },
        })),
    resetFormData: (initialName) =>
        set(() => ({
            formData: {
                name: initialName,
                currentPassword: "",
                newPassword: "",
            },
            error: "",
            success: false,
        })),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error, isLoading: false }),
    clearError: () => set({ error: "" }),
    setSuccess: (success) => set({ success }),
}))
