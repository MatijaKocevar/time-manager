import { useEffect, useState } from "react"
import type { HourType } from "@/../../prisma/generated/client"
import { useTrackerStore } from "../stores/tracker-store"
import { saveTrackerPreferences, getSystemTaskByType } from "../actions/tracker-actions"

interface UseTrackerSelectionProps {
    initialSelectedType: HourType
    initialSelectedTaskId: string | null
}

export function useTrackerSelection({
    initialSelectedType,
    initialSelectedTaskId,
}: UseTrackerSelectionProps) {
    // Use useState with server values to prevent flash
    const [selectedType, setSelectedTypeLocal] = useState(initialSelectedType)
    const [selectedTaskId, setSelectedTaskIdLocal] = useState(initialSelectedTaskId)

    const setSelectedTypeStore = useTrackerStore((state) => state.setSelectedType)
    const setSelectedTaskIdStore = useTrackerStore((state) => state.setSelectedTaskId)

    // Sync with store on mount
    useEffect(() => {
        setSelectedTypeStore(initialSelectedType)
        setSelectedTaskIdStore(initialSelectedTaskId)
    }, [initialSelectedType, initialSelectedTaskId, setSelectedTypeStore, setSelectedTaskIdStore])

    const handleTypeChange = async (type: string) => {
        const newType = type as HourType
        setSelectedTypeLocal(newType)
        setSelectedTypeStore(newType)

        // For BREAK and PRIVATE, fetch the system task ID
        if (newType === "BREAK" || newType === "PRIVATE") {
            const systemTask = await getSystemTaskByType(newType)
            const taskId = systemTask?.id ?? null
            setSelectedTaskIdLocal(taskId)
            setSelectedTaskIdStore(taskId)
            saveTrackerPreferences(newType, taskId)
        } else {
            setSelectedTaskIdLocal(null)
            setSelectedTaskIdStore(null)
            saveTrackerPreferences(newType, null)
        }
    }

    const handleTaskChange = (taskId: string) => {
        setSelectedTaskIdLocal(taskId)
        setSelectedTaskIdStore(taskId)
        saveTrackerPreferences(selectedType, taskId)
    }

    return {
        selectedType,
        selectedTaskId,
        handleTypeChange,
        handleTaskChange,
    }
}
