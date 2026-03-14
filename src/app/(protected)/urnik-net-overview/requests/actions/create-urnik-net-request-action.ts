"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import {
    CreateUrnikNetRequestSchema,
    type CreateUrnikNetRequestInput,
} from "../schemas/create-urnik-net-request-schema"

async function requireAuth() {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
        throw new Error("Unauthorized")
    }
    return session
}

async function loginToUrnikNet(username: string, password: string) {
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

        const formData = new URLSearchParams()
        formData.append("Input.UserName", username)
        formData.append("Input.Password", password)
        formData.append("__RequestVerificationToken", verificationToken)

        const loginResponse = await fetch("https://urnik.net/Account/Login?handler=Login", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent":
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
                Cookie: setCookieHeader.split(";")[0],
                Referer: "https://urnik.net/Account/Login",
            },
            body: formData.toString(),
        })

        const loginSetCookie = loginResponse.headers.get("set-cookie")
        if (!loginSetCookie) {
            return { success: false, error: "Login failed - no session cookie received" }
        }

        const languageResponse = await fetch(
            "https://urnik.net/Account/ChangeLanguage?culture=en-US",
            {
                method: "GET",
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
                    Cookie: loginSetCookie.split(";")[0],
                },
            }
        )

        const finalCookie = languageResponse.headers.get("set-cookie")
        const cookieToReturn = finalCookie
            ? finalCookie.split(";")[0]
            : loginSetCookie.split(";")[0]

        return { success: true, cookie: cookieToReturn }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Login failed",
        }
    }
}

export async function createUrnikNetRequest(
    input: CreateUrnikNetRequestInput
): Promise<{ success: boolean; trackingId?: string; error?: string }> {
    try {
        const session = await requireAuth()

        const validation = CreateUrnikNetRequestSchema.safeParse(input)
        if (!validation.success) {
            return {
                success: false,
                error: validation.error.issues[0]?.message || "Validation failed",
            }
        }

        const { type, date, startTime, endTime, comment } = validation.data

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                urnikUsername: true,
                urnikPassword: true,
            },
        })

        if (!user?.urnikUsername || !user?.urnikPassword) {
            return { success: false, error: "Urnik.net credentials not configured" }
        }

        const loginResult = await loginToUrnikNet(user.urnikUsername, user.urnikPassword)
        if (!loginResult.success || !loginResult.cookie) {
            return { success: false, error: loginResult.error || "Authentication failed" }
        }

        const [startHour, startMin] = startTime.split(":").map(Number)
        const [endHour, endMin] = endTime.split(":").map(Number)
        const startMinutes = startHour * 60 + startMin
        const endMinutes = endHour * 60 + endMin
        const hours = (endMinutes - startMinutes) / 60

        const urnikNetRequestRecord = await prisma.urnikRequest.create({
            data: {
                userId: session.user.id,
                date,
                startTime,
                endTime,
                hours,
                type,
                urnikType: type === "WORK" ? 110 : 124,
                status: "PENDING",
            },
        })

        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        const dateTime = `${year}/${month}/${day}`

        const url = new URL("https://urnik.net/App/Main")
        url.searchParams.append("handler", "SaveRequestHours")
        url.searchParams.append("timeStart", startTime)
        url.searchParams.append("timeEnd", endTime)
        url.searchParams.append("dateTime", dateTime)
        url.searchParams.append("type", String(urnikNetRequestRecord.urnikType))
        url.searchParams.append("comment", comment || urnikNetRequestRecord.id)

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
                Cookie: loginResult.cookie,
                Accept: "*/*",
                "Accept-Language": "en-GB,en;q=0.9,sl;q=0.8",
                "X-Requested-With": "XMLHttpRequest",
                Referer: "https://urnik.net/App/Main",
            },
        })

        if (!response.ok) {
            await prisma.urnikRequest.update({
                where: { id: urnikNetRequestRecord.id },
                data: {
                    status: "FAILED",
                    errorMessage: `HTTP ${response.status}: ${response.statusText}`,
                },
            })
            return {
                success: false,
                error: `Request failed with status ${response.status}`,
            }
        }

        revalidatePath("/urnik-net-overview/requests")
        return { success: true, trackingId: urnikNetRequestRecord.id }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to submit request",
        }
    }
}

export async function retryFailedUrnikNetRequest(
    trackingId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await requireAuth()

        const urnikRequest = await prisma.urnikRequest.findFirst({
            where: {
                id: trackingId,
                userId: session.user.id,
                status: "FAILED",
            },
        })

        if (!urnikRequest) {
            return { success: false, error: "Request not found or not eligible for retry" }
        }

        const result = await createUrnikNetRequest({
            type: urnikRequest.type as "WORK" | "WORK_FROM_HOME",
            date: urnikRequest.date,
            startTime: urnikRequest.startTime ?? "",
            endTime: urnikRequest.endTime ?? "",
            comment: undefined,
        })

        if (result.success) {
            await prisma.urnikRequest.delete({
                where: { id: trackingId },
            })
        }

        return result
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to retry request",
        }
    }
}
