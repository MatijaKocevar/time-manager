import { getTasks } from "./actions/task-actions"
import { TasksView } from "./components/tasks-view"

export default async function TasksPage() {
    const tasks = await getTasks()

    return <TasksView initialTasks={tasks} />
}
