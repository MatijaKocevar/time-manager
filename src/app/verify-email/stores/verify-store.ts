import { create } from "zustand"

interface VerifyEmailState {
    status: "loading" | "success" | "error"
    error: string
}

interface VerifyEmailActions {
    setStatus: (status: "loading" | "success" | "error") => void
    setError: (error: string) => void
    reset: () => void
}

const initialState: VerifyEmailState = {
    status: "loading",
    error: "",
}

export const useVerifyEmailStore = create<VerifyEmailState & VerifyEmailActions>((set) => ({
    ...initialState,
    setStatus: (status) => set({ status }),
    setError: (error) => set({ error }),
    reset: () => set(initialState),
}))
