# MCP Server

The app exposes a [Model Context Protocol](https://modelcontextprotocol.io) server at `/api/mcp`
(Streamable HTTP) so AI clients such as opencode can read and manage tasks, timers and hours.

## How it works

- The route `src/app/api/mcp/route.ts` uses `mcp-handler` + `@modelcontextprotocol/server` to serve the MCP protocol.
- Tools live in `src/features/mcp/tools/` and call **existing server actions** (`getTasks`, `startTimer`, `fetchMonthlyHourData`, ...).
- Authentication is a per-user API token sent as `Authorization: Bearer tm_...`.
  `withMcpAuth` validates it on every request; verification lives in `src/features/mcp/lib/verify-token.ts`.
- Inside a tool call, `runTool` puts the resolved identity into an `AsyncLocalStorage`
  (`runWithAuthIdentity` from `@/lib/auth-identity`). `requireAuth()` in `src/lib/auth-helpers.ts`
  falls back to that identity when no NextAuth cookie session exists, so all existing ownership checks,
  materialized-view refreshes and SSE broadcasts keep working unchanged.
- Tokens are **not** valid outside the MCP route: the identity is only injected there, so bearer tokens
  cannot be used to call server actions directly over HTTP.

## Create a token

1. Log in and open `/profile` → **MCP & API Tokens** → **Create Token**.
2. Give it a name (e.g. `opencode laptop`) and an optional expiry. The raw token is shown **once** — copy it.
3. Revoke tokens from the same section; revocation takes effect immediately (`lastUsedAt` is updated on use).

Tokens are stored as SHA-256 hashes (`ApiToken` model). A user can hold up to 20 tokens.
Demo accounts cannot create tokens.

## Client configuration (opencode)

`~/.config/opencode/opencode.json`:

```json
{
    "$schema": "https://opencode.ai/config.json",
    "mcp": {
        "time-manager": {
            "type": "remote",
            "url": "https://time.manager:8443/api/mcp",
            "enabled": true,
            "oauth": false,
            "timeout": 10000,
            "headers": {
                "Authorization": "Bearer {env:TIMEMANAGER_MCP_TOKEN}"
            }
        },
        "time-manager-dev": {
            "type": "remote",
            "url": "https://time-manager.home:3000/api/mcp",
            "enabled": true,
            "oauth": false,
            "timeout": 10000,
            "headers": {
                "Authorization": "Bearer {env:TIMEMANAGER_MCP_TOKEN}"
            }
        }
    }
}
```

Export the token in the shell opencode runs from (e.g. in `~/.zshrc`):

```bash
export TIMEMANAGER_MCP_TOKEN="tm_..."
```

`oauth: false` is important — without it the client may try OAuth discovery on a 401.
Use a separate token per machine and revoke it if the machine is lost.

## Tools

| Tool                | Purpose                                                    |
| ------------------- | ---------------------------------------------------------- |
| `list_tasks`        | List tasks (filter by status/list, system tasks excluded). |
| `get_task`          | Task details, description, tracked time and time entries.  |
| `create_task`       | Create a task or subtask.                                  |
| `update_task`       | Update title, description, status or order.                |
| `delete_task`       | Delete a task and its subtasks.                            |
| `list_task_lists`   | Lists with ids for `listId` filters/assignment.            |
| `get_active_timer`  | Currently running timer or null.                           |
| `start_timer`       | Start tracking a task or a category (auto-stops previous). |
| `stop_timer`        | Stop the active (or given) timer.                          |
| `get_monthly_hours` | Monthly totals: per-day by type, expected hours, overtime. |
| `get_timesheet`     | Tracked entries for a date range.                          |
| `get_today_summary` | Today's WORK/BREAK/PRIVATE totals + active timer.          |

Durations are in seconds, timestamps are ISO 8601. Every tool only ever sees the token owner's data.

## Troubleshooting

- **MCP server shows as unavailable in opencode** — the client could not reach the URL. Check VPN, then
  `curl -k https://time.manager:8443/api/health` (public). Restart/reconnect opencode afterwards.
- **401 Unauthorized** — token missing, revoked or expired. Check the `Bearer {env:TIMEMANAGER_MCP_TOKEN}`
  interpolation and re-create the token.
- **Tools missing after VPN reconnect** — opencode fetches the tool list at startup; restart it or use the
  MCP reconnect command (`opencode mcp list` to inspect servers).
- **Self-signed dev certificate** — if `https://time-manager.home:3000` is rejected, either trust the
  mkcert CA in the client environment or use the production endpoint.
- **403 / token works in dev but not prod** — the production reverse proxy must forward the
  `Authorization` header to the app.

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
# Transport: Streamable HTTP, URL: https://time-manager.home:3000/api/mcp,
# Header: Authorization: Bearer tm_...
```
