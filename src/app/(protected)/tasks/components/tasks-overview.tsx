import { TasksOverviewClient } from "./tasks-overview-client"
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

export function TasksOverview({ groups }: TasksOverviewProps) {
    return <TasksOverviewClient groups={groups} />
}
