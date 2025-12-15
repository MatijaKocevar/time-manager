import { create } from "zustand"
import { type HourType } from "../schemas/hour-action-schemas"
import { type ViewMode } from "../schemas/hour-filter-schemas"
import { DEFAULT_HOURS } from "../constants/hour-types"

interface SingleEntryFormState {
    data: {
        date: string
        hours: number
        type: HourType
        description: string
    }
    isLoading: boolean
    error: string
}

interface BulkEntryFormState {
    data: {
        startDate: string
        endDate: string
        hours: number
        type: HourType
        description: string
        skipWeekends: boolean
        skipHolidays: boolean
    }
    isLoading: boolean
    error: string
}

interface EditFormState {
    data: {
        id: string
        date: string
        hours: number
        type: HourType
        description: string
    } | null
    isLoading: boolean
    error: string
}

interface HoursStoreState {
    expandedTypes: Set<string>
    singleEntryForm: SingleEntryFormState
    bulkEntryForm: BulkEntryFormState
    editForm: EditFormState
    viewMode: ViewMode
    selectedDate: Date
}

interface HoursStoreActions {
    initializeExpandedTypes: (types: string[]) => void
    toggleType: (type: string) => void
    expandAll: () => void
    collapseAll: () => void
    setSingleEntryFormData: (
        data: Partial<{
            date: string
            hours: number
            type: HourType
            description: string
        }>
    ) => void
    resetSingleEntryForm: () => void
    setSingleEntryLoading: (isLoading: boolean) => void
    setSingleEntryError: (error: string) => void
    setBulkEntryFormData: (
        data: Partial<{
            startDate: string
            endDate: string
            hours: number
            type: HourType
            description: string
            skipWeekends: boolean
            skipHolidays: boolean
        }>
    ) => void
    resetBulkEntryForm: () => void
    setBulkEntryLoading: (isLoading: boolean) => void
    setBulkEntryError: (error: string) => void
    initializeEditForm: (entry: {
        id: string
        date: string
        hours: number
        type: HourType
        description: string
    }) => void
    setEditFormData: (
        data: Partial<{
            date: string
            hours: number
            type: HourType
            description: string
        }>
    ) => void
    resetEditForm: () => void
    setEditLoading: (isLoading: boolean) => void
    setEditError: (error: string) => void
    setViewMode: (mode: ViewMode) => void
    setSelectedDate: (date: Date) => void
}

const saveExpandedTypes = (types: Set<string>) => {
    if (typeof window === "undefined") return
    const typesArray = Array.from(types)
    try {
        localStorage.setItem("hours-expanded-types", JSON.stringify(typesArray))
    } catch {
        // Ignore localStorage errors
    }
    // Save to cookies for server-side access
    document.cookie = `hours-expanded-types=${JSON.stringify(typesArray)}; path=/; max-age=31536000; SameSite=Lax`
}

// Read initial state synchronously from localStorage
const getInitialExpandedTypes = (): Set<string> => {
    if (typeof window === "undefined") return new Set<string>()
    try {
        const stored = localStorage.getItem("hours-expanded-types")
        if (stored) {
            return new Set<string>(JSON.parse(stored) as string[])
        }
    } catch {
        // Ignore localStorage errors
    }
    return new Set<string>()
}

export const useHoursStore = create<HoursStoreState & HoursStoreActions>((set) => {
    const today = new Date().toISOString().split("T")[0]

    return {
        expandedTypes: getInitialExpandedTypes(),
        initializeExpandedTypes: (types) => {
            const expandedTypes = new Set<string>(types)
            set({ expandedTypes })
        },
        toggleType: (type) =>
            set((state) => {
                const newExpanded = new Set(state.expandedTypes)
                if (newExpanded.has(type)) {
                    newExpanded.delete(type)
                } else {
                    newExpanded.add(type)
                }
                saveExpandedTypes(newExpanded)
                return { expandedTypes: newExpanded }
            }),
        expandAll: () => {
            const allTypes = new Set(["WORK", "WORK_FROM_HOME", "VACATION", "SICK_LEAVE", "OTHER"])
            saveExpandedTypes(allTypes)
            set({ expandedTypes: allTypes })
        },
        collapseAll: () => {
            const emptySet = new Set<string>()
            saveExpandedTypes(emptySet)
            set({ expandedTypes: emptySet })
        },
        singleEntryForm: {
            data: {
                date: today,
                hours: DEFAULT_HOURS,
                type: "WORK",
                description: "",
            },
            isLoading: false,
            error: "",
        },
        bulkEntryForm: {
            data: {
                startDate: today,
                endDate: today,
                hours: DEFAULT_HOURS,
                type: "WORK",
                description: "",
                skipWeekends: true,
                skipHolidays: true,
            },
            isLoading: false,
            error: "",
        },
        editForm: {
            data: null,
            isLoading: false,
            error: "",
        },
        viewMode: "WEEKLY",
        selectedDate: new Date(),
        setSingleEntryFormData: (data) =>
            set((state) => ({
                singleEntryForm: {
                    ...state.singleEntryForm,
                    data: { ...state.singleEntryForm.data, ...data },
                },
            })),
        resetSingleEntryForm: () => {
            const today = new Date().toISOString().split("T")[0]
            set({
                singleEntryForm: {
                    data: {
                        date: today,
                        hours: DEFAULT_HOURS,
                        type: "WORK",
                        description: "",
                    },
                    isLoading: false,
                    error: "",
                },
            })
        },
        setSingleEntryLoading: (isLoading) =>
            set((state) => ({
                singleEntryForm: { ...state.singleEntryForm, isLoading },
            })),
        setSingleEntryError: (error) =>
            set((state) => ({
                singleEntryForm: { ...state.singleEntryForm, error },
            })),
        setBulkEntryFormData: (data) =>
            set((state) => ({
                bulkEntryForm: {
                    ...state.bulkEntryForm,
                    data: { ...state.bulkEntryForm.data, ...data },
                },
            })),
        resetBulkEntryForm: () => {
            const today = new Date().toISOString().split("T")[0]
            set({
                bulkEntryForm: {
                    data: {
                        startDate: today,
                        endDate: today,
                        hours: DEFAULT_HOURS,
                        type: "WORK",
                        description: "",
                        skipWeekends: true,
                        skipHolidays: true,
                    },
                    isLoading: false,
                    error: "",
                },
            })
        },
        setBulkEntryLoading: (isLoading) =>
            set((state) => ({
                bulkEntryForm: { ...state.bulkEntryForm, isLoading },
            })),
        setBulkEntryError: (error) =>
            set((state) => ({
                bulkEntryForm: { ...state.bulkEntryForm, error },
            })),
        initializeEditForm: (entry) =>
            set({
                editForm: {
                    data: entry,
                    isLoading: false,
                    error: "",
                },
            }),
        setEditFormData: (data) =>
            set((state) => ({
                editForm: {
                    ...state.editForm,
                    data: state.editForm.data ? { ...state.editForm.data, ...data } : null,
                },
            })),
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
        setViewMode: (mode) => set({ viewMode: mode }),
        setSelectedDate: (date) => set({ selectedDate: date }),
    }
})
