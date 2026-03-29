import { getServerSession } from "next-auth"
import { authConfig } from "./auth"
import { prisma } from "./prisma"
import { loginToUrnikNet } from "@/app/(protected)/urnik-net-overview/requests/actions/urnik-net-requests-actions"

async function extractUrnikUserId(cookie: string): Promise<string | null> {
    try {
        const response = await fetch("https://urnik.net/Account/Profile?handler=LoadProfile", {
            method: "GET",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
                Cookie: cookie,
                "X-Requested-With": "XMLHttpRequest",
                Accept: "*/*",
                "Accept-Language": "en-GB,en;q=0.9,sl;q=0.8",
                Referer: "https://urnik.net/App/Main",
            },
        })

        if (!response.ok) {
            console.error(`Failed to fetch profile page: ${response.status}`)
            return null
        }

        const html = await response.text()

        const userIdMatch = html.match(/<input[^>]*(?:id|name)="UserID"[^>]*value="([^"]+)"/i)

        if (!userIdMatch || !userIdMatch[1]) {
            console.error("Could not extract UserID from profile HTML")
            return null
        }

        const userId = userIdMatch[1].trim()
        console.log(`Successfully extracted urnik.net UserID: ${userId}`)
        return userId
    } catch (error) {
        console.error("Failed to extract urnik UserID:", error)
        return null
    }
}

export async function getUrnikCookie(): Promise<string | null> {
    try {
        const session = await getServerSession(authConfig)

        if (!session?.user) {
            return null
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { urnikUsername: true, urnikPassword: true, urnikUserId: true },
        })

        if (!user?.urnikUsername || !user?.urnikPassword) {
            return null
        }

        const result = await loginToUrnikNet(user.urnikUsername, user.urnikPassword)

        if (result.success && result.cookie) {
            const updateData: { lastUrnikTestAt: Date; urnikUserId?: string } = {
                lastUrnikTestAt: new Date(),
            }

            if (!user.urnikUserId) {
                const extractedUserId = await extractUrnikUserId(result.cookie)
                if (extractedUserId) {
                    updateData.urnikUserId = extractedUserId
                }
            }

            await prisma.user.update({
                where: { id: session.user.id },
                data: updateData,
            })

            return result.cookie
        }

        return null
    } catch (error) {
        console.error("Failed to get urnik cookie:", error)
        return null
    }
}

export async function getUrnikCookieForUser(userId: string): Promise<string | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { urnikUsername: true, urnikPassword: true, urnikUserId: true },
        })

        if (!user?.urnikUsername || !user?.urnikPassword) {
            return null
        }

        const result = await loginToUrnikNet(user.urnikUsername, user.urnikPassword)

        if (result.success && result.cookie) {
            const updateData: { lastUrnikTestAt: Date; urnikUserId?: string } = {
                lastUrnikTestAt: new Date(),
            }

            if (!user.urnikUserId) {
                const extractedUserId = await extractUrnikUserId(result.cookie)
                if (extractedUserId) {
                    updateData.urnikUserId = extractedUserId
                }
            }

            await prisma.user.update({
                where: { id: userId },
                data: updateData,
            })

            return result.cookie
        }

        return null
    } catch (error) {
        console.error("Failed to get urnik cookie for user:", error)
        return null
    }
}
