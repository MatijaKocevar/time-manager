import { create } from "zustand"
import type { RegisterInput } from "../schemas/register-schemas"

type RegisterFormData = Omit<RegisterInput, "locale">

interface RegisterState {
    formData: RegisterFormData
    isLoading: boolean
    error: string
    success: boolean
}

interface RegisterActions {
    setFormData: (data: Partial<RegisterFormData>) => void
    setLoading: (loading: boolean) => void
    setError: (error: string) => void
    setSuccess: (success: boolean) => void
    reset: () => void
}

const initialState: RegisterState = {
    formData: {
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    },
    isLoading: false,
    error: "",
    success: false,
}

export const useRegisterStore = create<RegisterState & RegisterActions>((set) => ({
    ...initialState,
    setFormData: (data) =>
        set((state) => ({
            formData: { ...state.formData, ...data },
        })),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    setSuccess: (success) => set({ success }),
    reset: () => set(initialState),
}))
