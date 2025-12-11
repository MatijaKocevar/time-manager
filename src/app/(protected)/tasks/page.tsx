import { getTasks } from "./actions/task-actions"
import { TasksView } from "./components/tasks-view"

export default async function TasksPage() {
    const tasks = await getTasks(null)

    return <TasksView initialTasks={tasks} listId={null} />
}
