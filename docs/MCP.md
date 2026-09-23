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
- Tokens are **not** valid outside the MCP route: the identity is only injected there, so bearer tokens
  cannot be used to call server actions directly over HTTP.

## Create a token

1. Log in and open `/profile` → **MCP & API Tokens** → **Create Token**.
2. Give it a name (e.g. `opencode laptop`) and an optional expiry. The raw token is shown **once** — copy it.
3. Revoke tokens from the same section; revocation takes effect immediately (`lastUsedAt` is updated on use).

Tokens are stored as SHA-256 hashes (`ApiToken` model). A user can hold up to 20 tokens.
Demo accounts cannot create tokens.

## Connect a device over the VPN

All client devices connect to the production MCP endpoint over WireGuard. Recommended address:

| Address                                  | Notes                                                                                        |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| `http://10.8.0.1:6280/api/mcp`           | **Recommended.** Server's WireGuard IP — works on any VPN device without DNS or LAN routing. |
| `https://time.manager:8443/api/mcp`      | HTTPS variant; requires the server's mkcert CA to be trusted by the device.                  |
| `http://192.168.0.10:6280/api/mcp`       | Only when the device can reach the home LAN (or the VPN routes `192.168.0.0/24`).            |
| `https://time-manager.home:3000/api/mcp` | Dev server on the development machine only.                                                  |

Plain HTTP is fine here: WireGuard encrypts the tunnel, so the token never travels the network
outside the VPN. (`time.manager` resolves to the LAN IP, which not every VPN device can route.)

### 1. Create a token on the device's behalf

1. With the VPN connected, open the app (`http://10.8.0.1:6280`) and log in.
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
            "url": "http://10.8.0.1:6280/api/mcp",
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

Replace `tm_...` with the token from step 1. If you prefer not to store the token in the file, use
`"Authorization": "Bearer {env:TIMEMANAGER_MCP_TOKEN}"` and export `TIMEMANAGER_MCP_TOKEN` in the
shell that launches opencode.

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
    "url": "https://time-manager.home:3000/api/mcp",
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

- **`time-manager` shows connection errors** — VPN is down or the server is unreachable. All other
  opencode tools keep working; check `curl http://10.8.0.1:6280/api/health` (public), reconnect the
  VPN and restart opencode.
- **401 `invalid_token` / `No authorization provided`** — token missing, revoked or expired. Check
  the header (including the `Bearer ` prefix) and create a new token if needed.
- **404** — wrong host or port. Production is `:6280`; `:3000` is the dev server only.
- **TLS error with `:8443`** — the device does not trust the server's mkcert CA. Use the HTTP VPN
  address instead, or install the CA.
- **Tools missing after reconnecting** — opencode loads the tool list at startup; restart it
  (`opencode mcp list` shows server status).

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
