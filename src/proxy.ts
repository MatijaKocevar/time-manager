import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

function getBrowserLocale(request: NextRequest): string {
    const acceptLanguage = request.headers.get("accept-language")

    if (!acceptLanguage) return "en"

    const languages = acceptLanguage.split(",").map((lang) => {
        const [code] = lang.split(";")[0].trim().split("-")
        return code.toLowerCase()
    })

    if (languages.includes("sl")) return "sl"

    return "en"
}

export default async function proxy(request: NextRequest) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-pathname", request.nextUrl.pathname)
    requestHeaders.set("x-request-id", crypto.randomUUID())

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    })

    if (!request.cookies.get("NEXT_LOCALE")) {
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

        let locale = "en"

        if (token?.sub) {
            const { prisma } = await import("@/lib/prisma")
            const user = await prisma.user.findUnique({
                where: { id: token.sub },
                select: { locale: true },
            })

            if (user?.locale) {
                locale = user.locale
            } else {
                locale = getBrowserLocale(request)
            }
        } else {
            locale = getBrowserLocale(request)
        }

        response.cookies.set("NEXT_LOCALE", locale, {
            path: "/",
            maxAge: 31536000,
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
