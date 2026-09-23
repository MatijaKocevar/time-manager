import type { AuthInfo, CallToolResult } from "@modelcontextprotocol/server"
import { runWithAuthIdentity, type AuthIdentity } from "@/lib/auth-identity"
import { identityFromAuthInfo } from "./verify-token"

export type ToolContext = {
    http?: {
        authInfo?: AuthInfo
    }
}

export function jsonResult(data: unknown): CallToolResult {
    return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    }
}

export function errorResult(message: string): CallToolResult {
    return {
        content: [{ type: "text", text: message }],
        isError: true,
    }
}

export async function runTool(
    ctx: ToolContext,
    handler: (identity: AuthIdentity) => Promise<CallToolResult>
): Promise<CallToolResult> {
    const identity = identityFromAuthInfo(ctx.http?.authInfo)

    if (!identity) {
        return errorResult("Unauthorized")
    }

    try {
        return await runWithAuthIdentity(identity, () => handler(identity))
    } catch (error) {
        return errorResult(error instanceof Error ? error.message : "Tool execution failed")
    }
}
