import { create } from "zustand"
import type { HourType } from "../schemas/hour-action-schemas"
import type { ViewMode } from "../schemas/hour-filter-schemas"

export const useHoursStore = create<{
    singleEntryForm: {
        data: {
            date: string
            hours: number
            type: HourType
            description: string
        }
        isLoading: boolean
        error: string
    }
    bulkEntryForm: {
        data: {
            startDate: string
            endDate: string
            hours: number
            type: HourType
            description: string
            skipWeekends: boolean
        }
        isLoading: boolean
        error: string
    }
    editForm: {
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
    viewMode: ViewMode
    selectedDate: Date
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
}>((set) => {
    const today = new Date().toISOString().split("T")[0]

    return {
        singleEntryForm: {
            data: {
                date: today,
                hours: 8,
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
                hours: 8,
                type: "WORK",
                description: "",
                skipWeekends: true,
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
                        hours: 8,
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
                        hours: 8,
                        type: "WORK",
                        description: "",
                        skipWeekends: true,
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
