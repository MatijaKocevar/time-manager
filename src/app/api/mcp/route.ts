import { createMcpHandler, withMcpAuth } from "mcp-handler"
import { registerTools, verifyApiToken } from "@/features/mcp"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const handler = createMcpHandler(registerTools, {
    serverInfo: {
        name: "time-manager",
        version: "1.0.0",
    },
    instructions:
        "Time Manager is a team time-tracking app. Users own task lists (projects); tasks can be nested " +
        "as subtasks and have status TODO, IN_PROGRESS, DONE, ON_HOLD or CANCELED. Tracking a task creates " +
        "a time entry; only one timer runs per user, and starting a new timer stops the previous one. " +
        "Entries have an hour type: WORK, WORK_FROM_HOME, BREAK, PRIVATE, VACATION or SICK_LEAVE. " +
        "System tasks (break, private, general work) are auto-created and cannot be deleted. " +
        "Timestamps are ISO 8601, durations are in seconds, dates use YYYY-MM-DD and months YYYY-MM. " +
        "Monthly hours include per-day totals by type, working days (weekends and holidays excluded), " +
        "expected hours and overtime. Use list_task_lists to discover list ids and list_tasks to discover " +
        "task ids; task lists can be created, updated and deleted, and tasks moved between them (list names " +
        "are unique and the default list cannot be deleted); every tool only accesses the token owner's data. " +
        "Individual tracked intervals can be listed, " +
        "added, edited, moved between tasks and deleted with the time-entry tools; their timestamps are ISO 8601 " +
        "with a timezone offset, and setting an end time on the running entry stops it. Time-off requests " +
        "(VACATION, SICK_LEAVE, WORK_FROM_HOME, WORK) are created PENDING and approved or rejected by an admin; " +
        "owners can list, create, update and cancel their own requests, and admin tokens can list all requests, " +
        "approve, reject or cancel approved ones. create_request can submit to Urnik.net with sendToUrnikNet when " +
        "the user has linked credentials, otherwise it stays in Time Manager. Read-only Urnik.net tools expose day " +
        "info, monthly hours, day detail, urnik requests and team presence from urnik.net, plus locally stored " +
        "submissions.",
})

const authHandler = withMcpAuth(handler, verifyApiToken, { required: true })

export { authHandler as GET, authHandler as POST }
