import { getTranslations } from "next-intl/server"
import { getTasks } from "../_actions/task-actions"
import { getListById, getLists } from "../_actions/list-actions"
import { TasksTable } from "../_components/tasks-table"
import { TasksViewClient } from "../_components/tasks-view-client"
import { TaskDescriptionDialog } from "../_components/task-description-dialog"
import { getTutorialsSeen, PageTour } from "@/features/tutorial"

interface ListPageProps {
    params: Promise<{
        listId: string
    }>
}

export default async function ListPage({ params }: ListPageProps) {
    const { listId } = await params
    const actualListId = listId === "no-list" ? null : listId

    const [tasks, list, lists, tutorialsSeen, tTutorial, tTasksList] = await Promise.all([
        getTasks({ listId: actualListId }),
        actualListId ? getListById(actualListId) : null,
        getLists(),
        getTutorialsSeen(),
        getTranslations("tutorial"),
        getTranslations("tutorial.tasksList"),
    ])

    return (
        <div className="flex flex-col h-full">
            <PageTour
                pageKey="/tasks/list"
                seenPages={tutorialsSeen}
                nextLabel={tTutorial("next")}
                prevLabel={tTutorial("previous")}
                doneLabel={tTutorial("done")}
                steps={[
                    {
                        element: "#tasks-list-new-task",
                        title: tTasksList("newTask.title"),
                        description: tTasksList("newTask.description"),
                        side: "bottom",
                    },
                    {
                        element: ".tasks-status-section",
                        title: tTasksList("statusSections.title"),
                        description: tTasksList("statusSections.description"),
                        side: "bottom",
                    },
                    {
                        element: ".tasks-time-tracker",
                        title: tTasksList("timer.title"),
                        description: tTasksList("timer.description"),
                        side: "left",
                    },
                    {
                        element: ".tasks-row-actions",
                        title: tTasksList("actions.title"),
                        description: tTasksList("actions.description"),
                        side: "left",
                    },
                ]}
            />
            <div className="flex-none space-y-4">
                <TasksViewClient listId={actualListId} />
            </div>
            <div className="flex-1 min-h-0 overflow-auto">
                <TasksTable tasks={tasks} listId={actualListId} lists={lists} />
            </div>
            <TaskDescriptionDialog />
        </div>
    )
}
