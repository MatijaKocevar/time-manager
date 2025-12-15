import { getTasks } from "../actions/task-actions"
import { getListById } from "../actions/list-actions"
import { TasksTable } from "../components/tasks-table"
import { TasksViewClient } from "../components/tasks-view-client"
import { SetBreadcrumbData } from "@/features/breadcrumbs"

interface ListPageProps {
    params: Promise<{
        listId: string
    }>
}

export default async function ListPage({ params }: ListPageProps) {
    const { listId } = await params
    const actualListId = listId === "no-list" ? null : listId

    const [tasks, list] = await Promise.all([
        getTasks({ listId: actualListId }),
        actualListId ? getListById(actualListId) : null,
    ])

    const breadcrumbLabel = listId === "no-list" ? "No List" : list?.name || "List"

    return (
        <>
            <SetBreadcrumbData
                data={{
                    [`/tasks/${listId}`]: breadcrumbLabel,
                }}
            />
            <div className="space-y-4">
                <TasksViewClient listId={actualListId} />
                <TasksTable tasks={tasks} listId={actualListId} />
            </div>
        </>
    )
}
