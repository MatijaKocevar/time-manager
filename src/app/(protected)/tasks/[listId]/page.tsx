import { getTranslations } from "next-intl/server"
import { cookies } from "next/headers"
import { getTasks } from "../_actions/task-actions"
import { getLists } from "../_actions/list-actions"
import { TasksTable } from "../_components/tasks-table"
import { TasksViewClient } from "../_components/tasks-view-client"
import { TaskDescriptionDialog } from "../_components/task-description-dialog"
import {
    DEFAULT_STATUS_SECTIONS,
    STATUS_SECTIONS_COOKIE,
    parseStatusSectionsCookie,
} from "../_utils/status-sections"
import { getTutorialsSeen, PageTour } from "@/features/tutorial"

interface ListPageProps {
    params: Promise<{
        listId: string
    }>
}

export default async function ListPage({ params }: ListPageProps) {
    const { listId } = await params
    const actualListId = listId === "no-list" ? null : listId

    const [tasks, lists, tutorialsSeen, tTutorial, tTasksList, cookieStore] = await Promise.all([
        getTasks({ listId: actualListId }),
        getLists(),
        getTutorialsSeen(),
        getTranslations("tutorial"),
        getTranslations("tutorial.tasksList"),
        cookies(),
    ])

    const statusSections = parseStatusSectionsCookie(cookieStore.get(STATUS_SECTIONS_COOKIE)?.value)
    const initialExpandedStatuses =
        statusSections[actualListId ?? "no-list"] ?? DEFAULT_STATUS_SECTIONS

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
            <TasksViewClient listId={actualListId} />
            <div className="flex-1 min-h-0 overflow-auto">
                <TasksTable
                    key={actualListId ?? "no-list"}
                    tasks={tasks}
                    listId={actualListId}
                    lists={lists}
                    initialExpandedStatuses={initialExpandedStatuses}
                />
            </div>
            <TaskDescriptionDialog />
        </div>
    )
}
