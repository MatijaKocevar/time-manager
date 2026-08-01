"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { URNIK_USER_AGENT } from "../../_lib/constants"
import { getErrorMessage } from "../../_utils/helpers"

export async function loginToUrnikNet(username: string, password: string) {
    try {
        const loginPageResponse = await fetch("https://urnik.net/Account/Login", {
            method: "GET",
            headers: {
                "User-Agent": URNIK_USER_AGENT,
            },
        })

        if (!loginPageResponse.ok) {
            return {
                success: false,
                error: `Failed to load login page: ${loginPageResponse.status}`,
            }
        }

        const htmlContent = await loginPageResponse.text()
        const setCookieHeader = loginPageResponse.headers.get("set-cookie")
        if (!setCookieHeader) {
            return { success: false, error: "No cookies received from login page" }
        }

        const tokenMatch = htmlContent.match(
            /<input[^>]*name="__RequestVerificationToken"[^>]*value="([^"]+)"/
        )
        if (!tokenMatch) {
            return { success: false, error: "Could not extract verification token from HTML" }
        }
        const verificationToken = tokenMatch[1]

        const antiforgeryToken = setCookieHeader.match(
            /\.AspNetCore\.Antiforgery\.[^=]+=([^;]+)/
        )?.[1]
        if (!antiforgeryToken) {
            return { success: false, error: "Could not extract antiforgery token" }
        }

        const cookies = setCookieHeader
            .split(",")
            .map((c) => c.trim().split(";")[0])
            .join("; ")

        const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2, 15)}`
        const formData = [
            `--${boundary}`,
            `Content-Disposition: form-data; name="pass"`,
            "",
            password,
            `--${boundary}`,
            `Content-Disposition: form-data; name="email"`,
            "",
            username,
            `--${boundary}--`,
        ].join("\r\n")

        const loginResponse = await fetch("https://urnik.net/Account/Login?handler=Login", {
            method: "POST",
            headers: {
                "Content-Type": `multipart/form-data; boundary=${boundary}`,
                "User-Agent": URNIK_USER_AGENT,
                Cookie: cookies,
                requestverificationtoken: verificationToken,
                "X-Requested-With": "XMLHttpRequest",
                Origin: "https://urnik.net",
                Referer: "https://urnik.net/Account/Login",
            },
            body: formData,
        })

        if (!loginResponse.ok) {
            return {
                success: false,
                error: `Login request failed: ${loginResponse.status}`,
            }
        }

        const responseText = await loginResponse.text()
        let responseData
        try {
            responseData = JSON.parse(responseText)
        } catch {
            return { success: false, error: "Invalid response format from server" }
        }

        if (!responseData.res) {
            return {
                success: false,
                error: "Login failed with invalid credentials",
            }
        }

        const authCookie = loginResponse.headers.get("set-cookie")
        if (!authCookie) {
            return { success: false, error: "No authentication cookie received" }
        }

        const sessionCookie = authCookie
            .split(",")
            .find((c) => c.includes(".AspNetCore.Cookies"))
            ?.split(";")[0]

        if (!sessionCookie) {
            return { success: false, error: "Session cookie not found in response" }
        }

        const langResponse = await fetch(
            "https://urnik.net/App/Main?handler=ChangeLang&culture=en-US&returnUrl=/App/MyRequests/MyRequests",
            {
                method: "GET",
                headers: {
                    "User-Agent": URNIK_USER_AGENT,
                    Cookie: sessionCookie,
                    "X-Requested-With": "XMLHttpRequest",
                },
                redirect: "manual",
            }
        )

        let finalCookie = sessionCookie
        const cultureCookie = langResponse.headers.get("set-cookie")
        if (cultureCookie) {
            const cultureValue = cultureCookie
                .split(",")
                .find((c) => c.includes(".AspNetCore.Culture"))
                ?.split(";")[0]
            if (cultureValue) {
                finalCookie = `${sessionCookie}; ${cultureValue}`
            }
        }

        return { success: true, cookie: finalCookie }
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error, "Unknown error occurred"),
        }
    }
}

export async function attemptUrnikNetLogin() {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        return { success: false, error: "Unauthorized" }
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            urnikUsername: true,
            urnikPassword: true,
        },
    })

    if (!user?.urnikUsername || !user?.urnikPassword) {
        return { success: false, error: "No credentials saved" }
    }

    const result = await loginToUrnikNet(user.urnikUsername, user.urnikPassword)

    if (result.success) {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { lastUrnikTestAt: new Date() },
        })
    }

    return result
}
