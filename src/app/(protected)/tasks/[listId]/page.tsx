import { getTasks } from "../actions/task-actions"
import { TasksTable } from "../components/tasks-table"
import { TasksViewClient } from "../components/tasks-view-client"

interface ListPageProps {
    params: Promise<{
        listId: string
    }>
}

export default async function ListPage({ params }: ListPageProps) {
    const { listId } = await params
    const actualListId = listId === "no-list" ? null : listId
    const tasks = await getTasks({ listId: actualListId })

    return (
        <div className="space-y-4">
            <TasksViewClient listId={actualListId} />
            <TasksTable tasks={tasks} listId={actualListId} />
        </div>
    )
}
