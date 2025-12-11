import { getTasks } from "../actions/task-actions"
import { TasksView } from "../components/tasks-view"

interface ListPageProps {
    params: Promise<{
        listId: string
    }>
}

export default async function ListPage({ params }: ListPageProps) {
    const { listId } = await params
    const tasks = await getTasks(listId)

    return <TasksView initialTasks={tasks} listId={listId} />
}
