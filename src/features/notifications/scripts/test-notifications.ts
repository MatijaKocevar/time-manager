import { prisma } from "@/lib/prisma"
import { sendEmail } from "../lib/email"
import { newRequestForAdminsEmail } from "../lib/email-templates"
import { sendPushNotification, sendPushToAdmins } from "../actions/notification-actions"

async function testEmail(userEmail: string) {
    const result = await sendEmail(
        userEmail,
        "Test Notification - Time Manager",
        newRequestForAdminsEmail(
            {
                userName: "Test User",
                requestType: "VACATION",
                startDate: new Date("2025-12-25"),
                endDate: new Date("2025-12-27"),
                reason: "This is a test notification from the notification system",
            },
            "en"
        )
    )

    return result
}

async function testPushNotification(userId: string) {
    const result = await sendPushNotification(userId, {
        title: "Test Push Notification",
        body: "This is a test notification from the Time Manager notification system",
        url: "/requests",
    })

    return result
}

async function testPushToAllAdmins() {
    await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true, email: true, name: true },
    })

    const result = await sendPushToAdmins({
        title: "Test Admin Notification",
        body: "This is a test notification for all administrators",
        url: "/admin/pending-requests",
    })

    return result
}

async function simulateRequestFlow(testUserEmail: string) {
    const testUser = await prisma.user.findUnique({
        where: { email: testUserEmail },
        select: { id: true, name: true, email: true },
    })

    if (!testUser) {
        return
    }

    await sendEmail(
        testUserEmail,
        "Test: New Request Created",
        newRequestForAdminsEmail(
            {
                userName: testUser.name || "Test User",
                requestType: "VACATION",
                startDate: new Date("2025-12-25"),
                endDate: new Date("2025-12-27"),
                reason: "Simulated test request",
            },
            "en"
        )
    )
    await sendPushToAdmins({
        title: "New Time-Off Request (Test)",
        body: `${testUser.name || testUser.email} has submitted a test vacation request`,
        url: "/admin/pending-requests",
    })

    await sendPushNotification(testUser.id, {
        title: "Request Approved ✓ (Test)",
        body: "Your test vacation request has been approved",
        url: "/requests",
    })

    await sendPushNotification(testUser.id, {
        title: "Request Rejected (Test)",
        body: "Your test vacation request has been rejected",
        url: "/requests",
    })
}

async function listPushSubscriptions() {
    const subscriptions = await prisma.pushSubscription.findMany({
        include: {
            user: {
                select: { name: true, email: true, role: true },
            },
        },
    })

    return subscriptions
}

async function main() {
    const args = process.argv.slice(2)
    const command = args[0]

    try {
        switch (command) {
            case "test-email": {
                const email = args[1]
                if (!email) {
                    console.error("Error: Email address required")
                    process.exit(1)
                }
                await testEmail(email)
                break
            }

            case "test-push": {
                const userId = args[1]
                if (!userId) {
                    console.error("Error: User ID required")
                    process.exit(1)
                }
                await testPushNotification(userId)
                break
            }

            case "test-admins": {
                await testPushToAllAdmins()
                break
            }

            case "simulate": {
                const email = args[1]
                if (!email) {
                    console.error("Error: User email required")
                    process.exit(1)
                }
                await simulateRequestFlow(email)
                break
            }

            case "list-subscriptions": {
                await listPushSubscriptions()
                break
            }

            default:
                console.error(`Unknown command: ${command}`)
                process.exit(1)
        }
    } catch (error) {
        console.error("\nError:", error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
