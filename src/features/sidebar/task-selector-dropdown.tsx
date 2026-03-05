"use client"

import { Circle } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { TaskDisplay } from "@/app/(protected)/tasks/schemas"

interface TaskSelectorDropdownProps {
    children: React.ReactNode
    tasks: TaskDisplay[]
    onSelectTask: (taskId: string) => void
    isLoading: boolean
    translations: {
        selectTask: string
        noTasksInProgress: string
    }
}

export function TaskSelectorDropdown({
    children,
    tasks,
    onSelectTask,
    isLoading,
    translations,
}: TaskSelectorDropdownProps) {
    const tasksByList = tasks.reduce(
        (acc, task) => {
            const listName = task.listName || "No List"
            if (!acc[listName]) {
                acc[listName] = []
            }
            acc[listName].push(task)
            return acc
        },
        {} as Record<string, TaskDisplay[]>
    )

    const listNames = Object.keys(tasksByList)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={isLoading}>
                {children}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>{translations.selectTask}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {tasks.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        {translations.noTasksInProgress}
                    </div>
                ) : (
                    listNames.map((listName, index) => (
                        <div key={listName}>
                            {listNames.length > 1 && (
                                <>
                                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                                        {listName}
                                    </DropdownMenuLabel>
                                </>
                            )}
                            {tasksByList[listName].map((task) => (
                                <DropdownMenuItem
                                    key={task.id}
                                    onClick={() => onSelectTask(task.id)}
                                    className="cursor-pointer"
                                >
                                    <Circle
                                        className="mr-2 h-3 w-3 shrink-0"
                                        style={{
                                            color: task.listColor || undefined,
                                        }}
                                        fill={task.listColor || "currentColor"}
                                    />
                                    <span className="truncate">{task.title}</span>
                                </DropdownMenuItem>
                            ))}
                            {index < listNames.length - 1 && <DropdownMenuSeparator />}
                        </div>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
