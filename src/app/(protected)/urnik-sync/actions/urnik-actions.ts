"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function loginToUrnik(username: string, password: string) {
    try {
        const loginPageResponse = await fetch("https://urnik.net/Account/Login", {
            method: "GET",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
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
                "User-Agent":
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
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

        return { success: true }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        }
    }
}

export async function attemptUrnikLogin() {
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

    const result = await loginToUrnik(user.urnikUsername, user.urnikPassword)

    if (result.success) {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { lastUrnikTestAt: new Date() },
        })
    }

    return result
}
