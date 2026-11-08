"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import { updateTask } from "../_actions/task-actions"
import { useQueryClient } from "@tanstack/react-query"
import { taskKeys } from "../_constants/query-keys"
import { useTasksStore } from "../_stores/tasks-store"
import { useTaskDialogStore } from "../_stores/task-dialog-stores"
import type { TaskTreeNode } from "../_schemas"

interface EditableTaskTitleProps {
    task: TaskTreeNode
}

export function EditableTaskTitle({ task }: EditableTaskTitleProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [value, setValue] = useState(task.title)
    const [previousTitle, setPreviousTitle] = useState(task.title)
    const t = useTranslations("tasks.description")
    const queryClient = useQueryClient()
    const inputRef = useRef<HTMLInputElement>(null)
    const setTaskOperationLoading = useTasksStore((state) => state.setTaskOperationLoading)
    const isLoading = useTasksStore(
        (state) => state.taskOperations.get(task.id)?.isLoading ?? false
    )
    const openDescriptionDialog = useTaskDialogStore((state) => state.openDescriptionDialog)

    if (task.title !== previousTitle) {
        setPreviousTitle(task.title)
        setValue(task.title)
    }

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus()
            inputRef.current?.select()
        }
    }, [isEditing])

    const handleSave = async () => {
        const trimmedValue = value.trim()
        setIsEditing(false)

        if (!trimmedValue || trimmedValue === task.title) {
            setValue(task.title)
            return
        }

        setTaskOperationLoading(task.id, true)
        try {
            const result = await updateTask({ id: task.id, title: trimmedValue })

            if (result.success) {
                await queryClient.invalidateQueries({ queryKey: taskKeys.all })
            } else {
                setValue(task.title)
            }
        } catch {
            setValue(task.title)
        } finally {
            setTaskOperationLoading(task.id, false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault()
            void handleSave()
        } else if (e.key === "Escape") {
            setValue(task.title)
            setIsEditing(false)
        }
    }

    if (isEditing) {
        return (
            <Input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={() => void handleSave()}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="h-8 font-medium"
            />
        )
    }

    return (
        <div className="flex items-center gap-1 group">
            <button
                type="button"
                className="text-sm font-medium text-left hover:underline underline-offset-2 cursor-pointer truncate"
                onClick={() => openDescriptionDialog(task.id, task.title)}
            >
                {task.title}
            </button>
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-100 md:h-6 md:w-6 md:opacity-0 md:group-hover:opacity-100 flex-shrink-0"
                onClick={() => setIsEditing(true)}
                aria-label={t("editTitle")}
                tabIndex={-1}
            >
                <Pencil className="h-4 w-4 md:h-3 md:w-3" />
            </Button>
        </div>
    )
}
