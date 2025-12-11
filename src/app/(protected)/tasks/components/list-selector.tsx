"use client"

import { Folder, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useTasksStore } from "../stores/tasks-store"
import type { ListDisplay } from "../schemas/list-schemas"

interface ListSelectorProps {
    lists: ListDisplay[]
    selectedListId: string | null
    onSelectList: (listId: string | null) => void
}

export function ListSelector({ lists, selectedListId, onSelectList }: ListSelectorProps) {
    const openListDialog = useTasksStore((state) => state.openListDialog)

    const selectedList = lists.find((list) => list.id === selectedListId)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2">
                    <Folder className="h-4 w-4" />
                    <span className="flex-1 text-left">
                        {selectedList ? selectedList.name : "All Tasks"}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => onSelectList(null)}>
                    <Folder className="mr-2 h-4 w-4" />
                    All Tasks
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {lists.map((list) => (
                    <DropdownMenuItem
                        key={list.id}
                        onClick={() => onSelectList(list.id)}
                        className="gap-2"
                    >
                        {list.color && (
                            <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: list.color }}
                            />
                        )}
                        <span className="flex-1">{list.name}</span>
                        {list.taskCount !== undefined && (
                            <span className="text-xs text-muted-foreground">{list.taskCount}</span>
                        )}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openListDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New List
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
