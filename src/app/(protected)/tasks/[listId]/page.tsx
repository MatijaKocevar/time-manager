import { getTasks } from "../actions/task-actions"
import { getListById, getLists } from "../actions/list-actions"
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

    const [tasks, list, lists] = await Promise.all([
        getTasks({ listId: actualListId }),
        actualListId ? getListById(actualListId) : null,
        getLists(),
    ])

    return (
        <div className="flex flex-col h-full">
            <div className="flex-none space-y-4">
                <TasksViewClient listId={actualListId} />
            </div>
            <div className="flex-1 min-h-0 overflow-auto">
                <TasksTable tasks={tasks} listId={actualListId} lists={lists} />
            </div>
        </div>
    )
}
