import { getTasks } from "@/app/(protected)/tasks/actions/task-actions"
import { getActiveTimer } from "@/app/(protected)/tasks/actions/task-time-actions"
import { TASK_STATUS } from "@/app/(protected)/tasks/constants/task-statuses"
import { TrackerClient } from "./components/tracker-client"

export default async function TrackerPage() {
    const [inProgressTasks, todoTasks, activeTimer] = await Promise.all([
        getTasks({ status: TASK_STATUS.IN_PROGRESS }),
        getTasks({ status: TASK_STATUS.TODO }),
        getActiveTimer(),
    ])

    const allTasks = [...inProgressTasks, ...todoTasks]

    return <TrackerClient initialTasks={allTasks} initialActiveTimer={activeTimer} />
}
