"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { updateTask } from "../actions/task-actions"
import { useQueryClient } from "@tanstack/react-query"
import { taskKeys } from "../query-keys"
import type { TaskTreeNode } from "../schemas"

interface EditableTaskTitleProps {
    task: TaskTreeNode
}

export function EditableTaskTitle({ task }: EditableTaskTitleProps) {
    const [value, setValue] = useState(task.title)
    const [isLoading, setIsLoading] = useState(false)
    const queryClient = useQueryClient()
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setValue(task.title)
    }, [task.title])

    const handleSave = async () => {
        const trimmedValue = value.trim()

        if (!trimmedValue || trimmedValue === task.title) {
            setValue(task.title)
            return
        }

        setIsLoading(true)
        try {
            const result = await updateTask({
                id: task.id,
                title: trimmedValue,
            })

            if (result.success) {
                await queryClient.invalidateQueries({ queryKey: taskKeys.all })
            } else {
                console.error("Failed to update task:", result.error)
                setValue(task.title)
            }
        } catch (error) {
            console.error("Failed to update task:", error)
            setValue(task.title)
        } finally {
            setIsLoading(false)
        }
    }

    const handleBlur = () => {
        void handleSave()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault()
            inputRef.current?.blur()
        } else if (e.key === "Escape") {
            setValue(task.title)
            inputRef.current?.blur()
        }
    }

    return (
        <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="h-8 font-medium"
        />
    )
}
