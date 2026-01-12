import { useEffect } from "react"
import type { HourType } from "@/../../prisma/generated/client"
import { useTrackerStore } from "../stores/tracker-store"
import { saveTrackerPreferences } from "../actions/tracker-actions"

interface UseTrackerSelectionProps {
    initialSelectedType: HourType
    initialSelectedTaskId: string | null
}

export function useTrackerSelection({
    initialSelectedType,
    initialSelectedTaskId,
}: UseTrackerSelectionProps) {
    const selectedType = useTrackerStore((state) => state.selectedType)
    const selectedTaskId = useTrackerStore((state) => state.selectedTaskId)
    const setSelectedType = useTrackerStore((state) => state.setSelectedType)
    const setSelectedTaskId = useTrackerStore((state) => state.setSelectedTaskId)

    useEffect(() => {
        setSelectedType(initialSelectedType)
        setSelectedTaskId(initialSelectedTaskId)
    }, [initialSelectedType, initialSelectedTaskId, setSelectedType, setSelectedTaskId])

    const handleTypeChange = (type: string) => {
        const newType = type as HourType
        setSelectedType(newType)
        setSelectedTaskId(null)
        saveTrackerPreferences(newType, null)
    }

    const handleTaskChange = (taskId: string) => {
        setSelectedTaskId(taskId)
        saveTrackerPreferences(selectedType, taskId)
    }

    return {
        selectedType,
        selectedTaskId,
        handleTypeChange,
        handleTaskChange,
    }
}
