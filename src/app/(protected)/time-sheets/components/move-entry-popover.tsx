"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { ArrowRightLeft } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { getTasks } from "../../tasks/actions/task-actions"
import { moveTimeEntryToTask } from "../actions/time-sheet-actions"
import { taskKeys } from "../../tasks/query-keys"
import { hourKeys } from "../../hours/query-keys"
import { timeSheetKeys } from "../query-keys"
import type { TaskDisplay } from "../../tasks/schemas/task-schemas"

interface MoveEntryPopoverProps {
    entryId: string
    currentTaskId: string
    translations: {
        moveEntry: string
        searchTasks: string
        noTasksFound: string
        moveSuccess: string
        moveError: string
    }
}

export function MoveEntryPopover({ entryId, currentTaskId, translations }: MoveEntryPopoverProps) {
    const [open, setOpen] = useState(false)
    const queryClient = useQueryClient()
    const router = useRouter()

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: taskKeys.list({}),
        queryFn: () => getTasks(),
        enabled: open,
    })

    const filteredTasks = tasks.filter((task: TaskDisplay) => task.id !== currentTaskId)

    const mutation = useMutation({
        mutationFn: moveTimeEntryToTask,
        onSuccess: (result) => {
            if (result.success) {
                toast.success(translations.moveSuccess)
                queryClient.invalidateQueries({ queryKey: taskKeys.all })
                queryClient.invalidateQueries({ queryKey: hourKeys.all })
                queryClient.invalidateQueries({ queryKey: timeSheetKeys.all })
                router.refresh()
            } else {
                toast.error(result.error ?? translations.moveError)
            }
            setOpen(false)
        },
        onError: () => {
            toast.error(translations.moveError)
        },
    })

    function handleSelect(taskId: string) {
        mutation.mutate({ entryId, targetTaskId: taskId })
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    aria-label={translations.moveEntry}
                >
                    <ArrowRightLeft className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={translations.searchTasks} />
                    <CommandList>
                        {isLoading && (
                            <div className="flex items-center justify-center py-6">
                                <LoadingSpinner />
                            </div>
                        )}
                        <CommandEmpty>{isLoading ? "" : translations.noTasksFound}</CommandEmpty>
                        <CommandGroup>
                            {filteredTasks.map((task: TaskDisplay) => (
                                <CommandItem
                                    key={task.id}
                                    value={task.title}
                                    onSelect={() => handleSelect(task.id)}
                                    className="cursor-pointer"
                                >
                                    <div
                                        className="mr-2 h-2 w-2 rounded-full flex-shrink-0"
                                        style={{
                                            backgroundColor: task.listColor ?? undefined,
                                        }}
                                    />
                                    <span className="truncate">{task.title}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
