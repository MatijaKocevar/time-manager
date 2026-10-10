# MCP Server

The app exposes a [Model Context Protocol](https://modelcontextprotocol.io) server at `/api/mcp`
(Streamable HTTP) so AI clients such as opencode can read and manage tasks, timers and hours.

## How it works

- The route `src/app/api/mcp/route.ts` uses `mcp-handler` + `@modelcontextprotocol/server` to serve the MCP protocol.
- The `instructions` field in that route is the app's primer: clients such as opencode inject it into the
  model's context at connect time (opencode renders it as `<mcp_instructions>`). Keep it accurate when the
  domain changes; the per-tool descriptions in `src/features/mcp/tools/` explain each capability.
- Tools live in `src/features/mcp/tools/` and call **existing server actions** (`getTasks`, `startTimer`, `fetchMonthlyHourData`, ...).
- Authentication is a per-user API token sent as `Authorization: Bearer tm_...`.
  `withMcpAuth` validates it on every request; verification lives in `src/features/mcp/lib/verify-token.ts`.
- Inside a tool call, `runTool` puts the resolved identity into an `AsyncLocalStorage`
  (`runWithAuthIdentity` from `@/lib/auth-identity`). `requireAuth()` in `src/lib/auth-helpers.ts`
  falls back to that identity when no NextAuth cookie session exists, so all existing ownership checks,
  materialized-view refreshes and SSE broadcasts keep working unchanged.
- Write tools broadcast over SSE/Pusher exactly like UI writes: timer tools emit `timer-started` /
  `timer-stopped`, and task tools emit `task-updated`. Open pages (tasks, tracker, time sheets, hours)
  subscribe to these events, so changes made through MCP appear without a reload.
- Tokens are **not** valid outside the MCP route: the identity is only injected there, so bearer tokens
  cannot be used to call server actions directly over HTTP.

## Create a token

1. Log in and open `/profile` → **MCP & API Tokens** → **Create Token**.
2. Give it a name (e.g. `opencode laptop`) and an optional expiry. The raw token is shown **once** — copy it.
3. Revoke tokens from the same section; revocation takes effect immediately (`lastUsedAt` is updated on use).

Tokens are stored as SHA-256 hashes (`ApiToken` model). A user can hold up to 20 tokens.
Demo accounts cannot create tokens.

## Connect a client

Point the client at your deployment's base URL followed by `/api/mcp`. Any address that reaches
the app works — use `https://<your-host>/api/mcp`, or an HTTP address only on a trusted network
such as a VPN. Prefer HTTPS so the token never travels in the clear.

### 1. Create a token on the device's behalf

1. Open the app in a browser and log in.
2. Go to **Profile → MCP & API Tokens → Create Token**.
3. Name it after the device (e.g. `opencode work-laptop`), optionally set an expiry, and copy the
   token — it is shown **only once**.

Create a separate token for every device and user. Revoke tokens from the same section when a
device is retired or lost; `lastUsedAt` tells you if a token is still in use.

### 2. Configure the MCP client (opencode)

Global config file (create it if missing):

- Linux/macOS: `~/.config/opencode/opencode.json`
- Windows: `C:\Users\<you>\.config\opencode\opencode.json`

Add the server to the `mcp` block (keep any existing servers):

```json
{
    "$schema": "https://opencode.ai/config.json",
    "mcp": {
        "time-manager": {
            "type": "remote",
            "url": "https://<your-host>/api/mcp",
            "enabled": true,
            "oauth": false,
            "timeout": 10000,
            "headers": {
                "Authorization": "Bearer tm_..."
            }
        }
    }
}
```

Replace `<your-host>` with the deployment's address and `tm_...` with the token from step 1. If you
prefer not to store the token in the file, use `"Authorization": "Bearer {env:TIMEMANAGER_MCP_TOKEN}"`
and export `TIMEMANAGER_MCP_TOKEN` in the shell that launches opencode.

`oauth: false` is required — without it the client tries OAuth discovery on a 401.

### 3. Verify

1. Restart opencode (config is read only at startup).
2. Ask the agent to _"list my tasks"_ or run `opencode mcp list`.
3. The sidebar should show `time-manager Connected`; successful tool calls confirm the token works.

### Development server (optional)

On the development machine, a second entry can point at the local dev server:

```json
"time-manager-dev": {
    "type": "remote",
    "url": "https://<your-dev-host>:3000/api/mcp",
    "enabled": false,
    "oauth": false,
    "timeout": 10000,
    "headers": {
        "Authorization": "Bearer tm_..."
    }
}
```

Enable it only while developing MCP changes (requires the dev HTTPS certs to be trusted), and keep
it disabled otherwise so tools always come from production.

### Troubleshooting

- **`time-manager` shows connection errors** — the server is unreachable. All other opencode tools
  keep working; check `curl <base-url>/api/health` (public), restore the connection and restart
  opencode.
- **401 `invalid_token` / `No authorization provided`** — token missing, revoked or expired. Check
  the header (including the `Bearer ` prefix) and create a new token if needed.
- **404** — wrong host or port; the endpoint is `<base-url>/api/mcp` (dev server: `:3000`).
- **TLS error** — the device does not trust the server's certificate. Install the CA or use an HTTP
  address on a trusted network.
- **Tools missing after reconnecting** — opencode loads the tool list at startup; restart it
  (`opencode mcp list` shows server status).

## Tools

| Tool                            | Purpose                                                      |
| ------------------------------- | ------------------------------------------------------------ |
| `list_tasks`                    | List tasks (filter by status/list, system tasks excluded).   |
| `get_task`                      | Task details, description, tracked time and time entries.    |
| `create_task`                   | Create a task or subtask.                                    |
| `update_task`                   | Update title, description, status or order.                  |
| `delete_task`                   | Delete a task and its subtasks.                              |
| `list_task_lists`               | Lists with ids for `listId` filters/assignment.              |
| `get_active_timer`              | Currently running timer or null.                             |
| `start_timer`                   | Start tracking a task or a category (auto-stops previous).   |
| `stop_timer`                    | Stop the active (or given) timer.                            |
| `list_time_entries`             | Tracked entries for a date range (ids for edit/move/delete). |
| `create_time_entry`             | Add a completed entry for a task (start + end time).         |
| `update_time_entry`             | Edit start/end times; setting endTime stops a running entry. |
| `delete_time_entry`             | Delete a time entry.                                         |
| `move_time_entry`               | Move ("switch") a time entry to another task.                |
| `list_my_requests`              | Own time-off/absence requests with status and details.       |
| `create_request`                | Create a vacation/sick/WFH/work request (PENDING).           |
| `update_request`                | Update a pending request's type, dates, reason or location.  |
| `cancel_request`                | Cancel own pending request.                                  |
| `list_all_requests`             | (Admin) All users' requests, filter by status/userId.        |
| `approve_request`               | (Admin) Approve a pending request (FIFO order enforced).     |
| `reject_request`                | (Admin) Reject a pending request with optional reason.       |
| `cancel_approved_request`       | (Admin) Cancel an approved request with a reason.            |
| `get_urnik_day_info`            | Today's urnik.net day info (hours, balances, vacation).      |
| `get_urnik_monthly_hours`       | Monthly hours table from urnik.net.                          |
| `get_urnik_day_detail`          | Single-day urnik.net entries and break totals.               |
| `get_urnik_requests`            | The user's requests as listed on urnik.net.                  |
| `list_submitted_urnik_requests` | Locally stored urnik.net submissions + sync status.          |
| `get_urnik_team_status`         | Team presence (present/absent) from urnik.net.               |
| `get_monthly_hours`             | Monthly totals: per-day by type, expected hours, overtime.   |
| `get_timesheet`                 | Tracked entries for a date range.                            |
| `get_today_summary`             | Today's WORK/BREAK/PRIVATE totals + active timer.            |

Durations are in seconds, timestamps are ISO 8601. Every tool only ever sees the token owner's data.

Time-entry timestamps must be ISO 8601 **with a timezone offset** (e.g. `2026-10-10T09:00:00+02:00`):
the server may run in UTC, so an offset-free time would be misread. Entry ids come from `get_timesheet`,
`get_task` or `list_time_entries`. `update_time_entry` on the running entry (endTime `null`) stops it at the
given time, which fixes a timer that was left running; an ended entry cannot be reopened.

Request tools follow the app's rules: owners handle their own pending requests, admins process requests in
submission order (FIFO). Admin tools are registered for every token but return `Admin access required` for
non-admin users, and the underlying actions re-check the role. `create_request` can submit to Urnik.net when
`sendToUrnikNet` is true and the user has linked Urnik.net credentials; a failed submission falls back to
normal admin approval.

Urnik.net tools are read-only: they call urnik.net live with the user's linked credentials and never clock
in/out or submit anything.

## Adding a tool

1. Create/extend a module in `src/features/mcp/tools/` and register it with `server.registerTool(...)`
   (`inputSchema` is a Zod `z.object(...)`).
2. Wrap the handler body in `runTool(ctx, async (identity) => ...)` and return `jsonResult(data)` or
   `errorResult(message)`.
3. Call an existing server action when possible. If it needs an explicit user id, use `identity.userId`.
4. Register the module in `src/features/mcp/server.ts` and verify with `npx tsc --noEmit`, `npm run lint`
   and the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector
# Transport: Streamable HTTP, URL: <base-url>/api/mcp,
# Header: Authorization: Bearer tm_...
```
