import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default function proxy(request: NextRequest) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-pathname", request.nextUrl.pathname)
    requestHeaders.set("x-request-id", crypto.randomUUID())

    // Handle locale cookie for i18n
    const locale = request.cookies.get("NEXT_LOCALE")?.value || "en"

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    })

    if (!request.cookies.get("NEXT_LOCALE")) {
        response.cookies.set("NEXT_LOCALE", locale, {
            path: "/",
            sameSite: "lax",
        })
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
}
