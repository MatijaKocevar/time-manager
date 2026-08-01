import { useEffect, useRef, useState } from "react"
import type { HourType } from "@/../../prisma/generated/client"
import { useTrackerStore } from "../_stores/tracker-store"
import { saveTrackerPreferences, getSystemTaskByType } from "../_actions/tracker-actions"

interface UseTrackerSelectionProps {
    initialSelectedType: HourType
    initialSelectedTaskId: string | null
    activeTimerData?: {
        type: HourType
        taskId: string
    } | null
}

export function useTrackerSelection({
    initialSelectedType,
    initialSelectedTaskId,
    activeTimerData,
}: UseTrackerSelectionProps) {
    const [selectedType, setSelectedTypeLocal] = useState(initialSelectedType)
    const [selectedTaskId, setSelectedTaskIdLocal] = useState(initialSelectedTaskId)

    const setSelectedTypeStore = useTrackerStore((state) => state.setSelectedType)
    const setSelectedTaskIdStore = useTrackerStore((state) => state.setSelectedTaskId)

    const isFirstMount = useRef(true)

    const isWorkType = (t: HourType) => t === "WORK" || t === "WORK_FROM_HOME"

    const lastWorkTaskRef = useRef<string | null>(
        isWorkType(initialSelectedType) ? initialSelectedTaskId : null
    )

    useEffect(() => {
        if (activeTimerData) {
            setSelectedTypeLocal(activeTimerData.type)
            setSelectedTaskIdLocal(activeTimerData.taskId)
            setSelectedTypeStore(activeTimerData.type)
            setSelectedTaskIdStore(activeTimerData.taskId)
        } else if (isFirstMount.current) {
            setSelectedTypeLocal(initialSelectedType)
            setSelectedTaskIdLocal(initialSelectedTaskId)
            setSelectedTypeStore(initialSelectedType)
            setSelectedTaskIdStore(initialSelectedTaskId)
        }

        isFirstMount.current = false
    }, [
        activeTimerData,
        initialSelectedType,
        initialSelectedTaskId,
        setSelectedTypeStore,
        setSelectedTaskIdStore,
    ])

    const handleTypeChange = async (type: string) => {
        const newType = type as HourType
        setSelectedTypeLocal(newType)
        setSelectedTypeStore(newType)

        // For BREAK and PRIVATE, fetch the system task ID
        if (newType === "BREAK" || newType === "PRIVATE") {
            lastWorkTaskRef.current = selectedTaskId

            const systemTask = await getSystemTaskByType(newType)
            const taskId = systemTask?.id ?? null
            setSelectedTaskIdLocal(taskId)
            setSelectedTaskIdStore(taskId)
            saveTrackerPreferences(newType, taskId)
        } else {
            const restoredTaskId = lastWorkTaskRef.current
            setSelectedTaskIdLocal(restoredTaskId)
            setSelectedTaskIdStore(restoredTaskId)
            saveTrackerPreferences(newType, restoredTaskId)
        }
    }

    const handleTaskChange = (taskId: string) => {
        lastWorkTaskRef.current = taskId
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
