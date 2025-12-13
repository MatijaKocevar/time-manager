import { getTasks } from "../actions/task-actions"
import { TasksView } from "../components/tasks-view"

interface ListPageProps {
    params: Promise<{
        listId: string
    }>
}

export default async function ListPage({ params }: ListPageProps) {
    const { listId } = await params
    const actualListId = listId === "no-list" ? null : listId
    const tasks = await getTasks({ listId: actualListId })

    return <TasksView initialTasks={tasks} listId={actualListId} />
}
