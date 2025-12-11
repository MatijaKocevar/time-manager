import { create } from "zustand"
import type { HourType } from "@/../../prisma/generated/client"

export interface PendingChange {
    cellKey: string
    entryId: string | null
    date: string
    type: HourType
    hours: number
    originalHours: number | null
    action: "create" | "update" | "delete"
}

interface HoursBatchState {
    pendingChanges: Map<string, PendingChange>
    isDirty: boolean
    isSaving: boolean
    error: string | null
}

interface HoursBatchActions {
    addChange: (change: {
        entryId: string | null
        date: string
        type: HourType
        hours: number
        originalHours: number | null
        action: "create" | "update" | "delete"
        userId: string
    }) => void
    removeChange: (cellKey: string) => void
    clearChanges: () => void
    setIsSaving: (saving: boolean) => void
    setError: (error: string | null) => void
    getPendingChange: (cellKey: string) => PendingChange | undefined
    getAllChanges: () => PendingChange[]
    getChangeCount: () => number
}

export const useHoursBatchStore = create<HoursBatchState & HoursBatchActions>((set, get) => ({
    pendingChanges: new Map(),
    isDirty: false,
    isSaving: false,
    error: null,

    addChange: (change) => {
        const cellKey = `${change.date}-${change.type}`
        const newChanges = new Map(get().pendingChanges)

        newChanges.set(cellKey, {
            ...change,
            cellKey,
        })

        set({
            pendingChanges: newChanges,
            isDirty: true,
            error: null,
        })
    },

    removeChange: (cellKey) => {
        const newChanges = new Map(get().pendingChanges)
        newChanges.delete(cellKey)

        set({
            pendingChanges: newChanges,
            isDirty: newChanges.size > 0,
        })
    },

    clearChanges: () => {
        set({
            pendingChanges: new Map(),
            isDirty: false,
            error: null,
        })
    },

    setIsSaving: (saving) => {
        set({ isSaving: saving })
    },

    setError: (error) => {
        set({ error })
    },

    getPendingChange: (cellKey) => {
        return get().pendingChanges.get(cellKey)
    },

    getAllChanges: () => {
        return Array.from(get().pendingChanges.values())
    },

    getChangeCount: () => {
        return get().pendingChanges.size
    },
}))
