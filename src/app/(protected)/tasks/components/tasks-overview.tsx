import { TasksTable } from "./tasks-table"
import { CreateTaskDialog } from "./create-task-dialog"
import { DeleteTaskDialog } from "./delete-task-dialog"
import { TimeEntriesDialog } from "./time-entries-dialog"
import { CreateListDialog } from "./create-list-dialog"
import { MoveTaskDialog } from "./move-task-dialog"
import { OverviewNewTaskButton } from "./overview-new-task-button"
import type { TaskDisplay } from "../schemas"
import type { ListDisplay } from "../schemas/list-schemas"

interface TaskGroup {
    listId: string | null
    listName: string
    listColor: string | null
    listIcon: string | null
    tasks: TaskDisplay[]
}

interface TasksOverviewProps {
    groups: TaskGroup[]
    lists: ListDisplay[]
}

export function TasksOverview({ groups, lists }: TasksOverviewProps) {
    return (
        <div className="space-y-8">
            {groups.map((group) => {
                return (
                    <div key={group.listId ?? "no-list"} className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {group.listIcon && (
                                    <span className="text-2xl">{group.listIcon}</span>
                                )}
                                {group.listColor && (
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: group.listColor }}
                                    />
                                )}
                                <h2 className="text-xl font-semibold">{group.listName}</h2>
                                <span className="text-sm text-muted-foreground">
                                    ({group.tasks.length}{" "}
                                    {group.tasks.length === 1 ? "task" : "tasks"})
                                </span>
                            </div>
                            <OverviewNewTaskButton listId={group.listId} />
                        </div>
                        <TasksTable tasks={group.tasks} />
                    </div>
                )
            })}

            <CreateTaskDialog />
            <DeleteTaskDialog />
            <TimeEntriesDialog />
            <CreateListDialog />
            <MoveTaskDialog lists={lists} />
        </div>
    )
}
