import { create } from "zustand"
import {
    type SingleEntryFormData,
    type BulkEntryFormData,
    type EditFormData,
} from "../schemas/hour-action-schemas"
import { type ViewMode, VIEW_MODE_VALUES } from "../schemas/hour-filter-schemas"
import { DEFAULT_HOURS, HOUR_TYPE_VALUES } from "../constants/hour-types"
import { saveUserPreferences } from "../actions/hour-actions"
import type { z } from "zod"
import { HourTypeSchema } from "../schemas/hour-action-schemas"

type HourType = z.infer<typeof HourTypeSchema>

interface HourTypeDialogEntry {
    date: Date
    hours: number
}

interface SingleEntryFormState {
    data: SingleEntryFormData
    isLoading: boolean
    error: string
}

interface BulkEntryFormState {
    data: BulkEntryFormData
    isLoading: boolean
    error: string
}

interface EditFormState {
    data: EditFormData | null
    isLoading: boolean
    error: string
}

interface HoursStoreState {
    summaryCollapsed: boolean
    singleEntryForm: SingleEntryFormState
    bulkEntryForm: BulkEntryFormState
    editForm: EditFormState
    viewMode: ViewMode
    selectedDate: Date
    hourTypeDialog: {
        isOpen: boolean
        type: HourType | null
        entries: HourTypeDialogEntry[] | null
    }
}

interface HoursStoreActions {
    toggleSummary: () => void
    setSingleEntryFormData: (data: Partial<SingleEntryFormData>) => void
    resetSingleEntryForm: () => void
    setSingleEntryLoading: (isLoading: boolean) => void
    setSingleEntryError: (error: string) => void
    setBulkEntryFormData: (data: Partial<BulkEntryFormData>) => void
    resetBulkEntryForm: () => void
    setBulkEntryLoading: (isLoading: boolean) => void
    setBulkEntryError: (error: string) => void
    initializeEditForm: (entry: EditFormData) => void
    setEditFormData: (data: Partial<Omit<EditFormData, "id">>) => void
    resetEditForm: () => void
    setEditLoading: (isLoading: boolean) => void
    setEditError: (error: string) => void
    setViewMode: (mode: ViewMode) => void
    setSelectedDate: (date: Date) => void
    openHourTypeDialog: (type: HourType, entries: HourTypeDialogEntry[]) => void
    closeHourTypeDialog: () => void
}

const saveSummaryCollapsed = (collapsed: boolean) => {
    if (typeof window === "undefined") return
    try {
        localStorage.setItem("hours-summary-collapsed", JSON.stringify(collapsed))
        saveUserPreferences({ hoursCardCollapsed: collapsed }).catch(() => {
            // Ignore errors
        })
    } catch {
        // Ignore localStorage errors
    }
    document.cookie = `hours-summary-collapsed=${collapsed}; path=/; max-age=31536000; SameSite=Lax`
}

const saveViewMode = (mode: ViewMode) => {
    if (typeof window === "undefined") return
    try {
        saveUserPreferences({ hoursViewMode: mode }).catch(() => {
            // Ignore errors
        })
    } catch {
        // Ignore errors
    }
}

const getInitialSummaryCollapsed = (): boolean => {
    if (typeof window === "undefined") return false
    try {
        const stored = localStorage.getItem("hours-summary-collapsed")
        if (stored) {
            return JSON.parse(stored) as boolean
        }
    } catch {
        // Ignore localStorage errors
    }
    return false
}

export const useHoursStore = create<HoursStoreState & HoursStoreActions>((set) => {
    const today = new Date().toISOString().split("T")[0]

    return {
        summaryCollapsed: getInitialSummaryCollapsed(),
        toggleSummary: () =>
            set((state) => {
                const newCollapsed = !state.summaryCollapsed
                saveSummaryCollapsed(newCollapsed)
                return { summaryCollapsed: newCollapsed }
            }),
        singleEntryForm: {
            data: {
                date: today,
                hours: DEFAULT_HOURS,
                type: HOUR_TYPE_VALUES.WORK,
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
                type: HOUR_TYPE_VALUES.WORK,
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
        viewMode: VIEW_MODE_VALUES.WEEKLY,
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
                        type: HOUR_TYPE_VALUES.WORK,
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
                        type: HOUR_TYPE_VALUES.WORK,
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
        setViewMode: (mode) => {
            saveViewMode(mode)
            set({ viewMode: mode })
        },
        setSelectedDate: (date) => set({ selectedDate: date }),
        hourTypeDialog: {
            isOpen: false,
            type: null,
            entries: null,
        },
        openHourTypeDialog: (type, entries) =>
            set({
                hourTypeDialog: {
                    isOpen: true,
                    type,
                    entries,
                },
            }),
        closeHourTypeDialog: () =>
            set({
                hourTypeDialog: {
                    isOpen: false,
                    type: null,
                    entries: null,
                },
            }),
    }
})
