import { getInProgressTasksByLists } from "./actions/task-actions"
import { getLists } from "./actions/list-actions"
import { TasksOverview } from "./components/tasks-overview"

export default async function TasksPage() {
    const [groupedTasks, lists] = await Promise.all([getInProgressTasksByLists(), getLists()])

    const tasksByListId = new Map(groupedTasks.map((group) => [group.listId ?? "no-list", group]))

    const allGroups = [
        {
            listId: null,
            listName: "No List",
            listColor: "#6b7280",
            listIcon: null,
            tasks: tasksByListId.get("no-list")?.tasks ?? [],
        },
        ...lists.map((list) => ({
            listId: list.id,
            listName: list.name,
            listColor: list.color,
            listIcon: list.icon,
            tasks: tasksByListId.get(list.id)?.tasks ?? [],
        })),
    ]

    return <TasksOverview groups={allGroups} lists={lists} />
}
