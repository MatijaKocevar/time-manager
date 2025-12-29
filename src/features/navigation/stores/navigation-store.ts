import { create } from "zustand"

interface NavigationState {
    isNavigating: boolean
}

interface NavigationActions {
    setNavigating: (navigating: boolean) => void
}

export const useNavigationStore = create<NavigationState & NavigationActions>((set) => ({
    isNavigating: false,
    setNavigating: (navigating) => set({ isNavigating: navigating }),
}))
