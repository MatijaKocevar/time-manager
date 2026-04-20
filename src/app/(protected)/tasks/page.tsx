import { getTranslations } from "next-intl/server"
import { getInProgressTasksByLists } from "./actions/task-actions"
import { getLists } from "./actions/list-actions"
import { TasksOverview } from "./components/tasks-overview"
import { getTutorialsSeen, PageTour } from "@/features/tutorial"

export default async function TasksPage() {
    const [groupedTasks, lists, tutorialsSeen, tTutorial, tTasks] = await Promise.all([
        getInProgressTasksByLists(),
        getLists(),
        getTutorialsSeen(),
        getTranslations("tutorial"),
        getTranslations("tutorial.tasks"),
    ])

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

    return (
        <div className="h-full overflow-auto">
            <PageTour
                pageKey="/tasks"
                seenPages={tutorialsSeen}
                nextLabel={tTutorial("next")}
                prevLabel={tTutorial("previous")}
                doneLabel={tTutorial("done")}
                steps={[
                    {
                        element: "#tasks-overview-new-task",
                        title: tTasks("newTask.title"),
                        description: tTasks("newTask.description"),
                        side: "bottom",
                    },
                    {
                        element: ".tasks-overview-group",
                        title: tTasks("groups.title"),
                        description: tTasks("groups.description"),
                        side: "bottom",
                    },
                    {
                        element: ".tasks-time-tracker",
                        title: tTasks("timer.title"),
                        description: tTasks("timer.description"),
                        side: "left",
                    },
                    {
                        element: ".tasks-time-entries-btn",
                        title: tTasks("timeEntries.title"),
                        description: tTasks("timeEntries.description"),
                        side: "left",
                    },
                ]}
            />
            <TasksOverview groups={allGroups} lists={lists} />
        </div>
    )
}
