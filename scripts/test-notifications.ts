import { PrismaClient } from "@/../../prisma/generated/client"
import { sendEmail } from "../src/lib/notifications/email"
import { newRequestForAdminsEmail } from "../src/lib/notifications/email-templates"
import {
    sendPushNotification,
    sendPushToAdmins,
} from "../src/app/(protected)/profile/actions/notification-actions"

const prisma = new PrismaClient()

async function testEmail(userEmail: string) {
    console.log("\n🧪 Testing Email Notification")
    console.log("================================")
    console.log(`Sending test email to: ${userEmail}`)

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

    if (result.success) {
        console.log("✅ Email sent successfully!")
    } else {
        console.log(`❌ Email failed: ${result.error}`)
    }

    return result
}

async function testPushNotification(userId: string) {
    console.log("\n🧪 Testing Push Notification")
    console.log("================================")
    console.log(`Sending push notification to user: ${userId}`)

    const result = await sendPushNotification(userId, {
        title: "Test Push Notification",
        body: "This is a test notification from the Time Manager notification system",
        url: "/requests",
    })

    if (result.success) {
        console.log(`✅ Push notification sent to ${result.sent} subscription(s)`)
    } else {
        console.log(`❌ Push notification failed: ${result.error}`)
    }

    return result
}

async function testPushToAllAdmins() {
    console.log("\n🧪 Testing Push to All Admins")
    console.log("================================")

    const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true, email: true, name: true },
    })

    console.log(`Found ${admins.length} admin(s)`)
    admins.forEach((admin) => {
        console.log(`  - ${admin.name || admin.email}`)
    })

    const result = await sendPushToAdmins({
        title: "Test Admin Notification",
        body: "This is a test notification for all administrators",
        url: "/admin/pending-requests",
    })

    if (result.success) {
        console.log(`✅ Sent to ${result.sent} admin(s)`)
    } else {
        console.log(`❌ Failed: ${result.error}`)
    }

    return result
}

async function simulateRequestFlow(testUserEmail: string) {
    console.log("\n🧪 Simulating Complete Request Flow")
    console.log("=====================================")

    const testUser = await prisma.user.findUnique({
        where: { email: testUserEmail },
        select: { id: true, name: true, email: true },
    })

    if (!testUser) {
        console.log(`❌ User with email ${testUserEmail} not found`)
        return
    }

    console.log(`User found: ${testUser.name || testUser.email}`)

    console.log("\n1️⃣ Simulating request creation notification to admins...")
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
    console.log("✅ Admin notifications sent")

    console.log("\n2️⃣ Simulating approval notification to user...")
    await sendPushNotification(testUser.id, {
        title: "Request Approved ✓ (Test)",
        body: "Your test vacation request has been approved",
        url: "/requests",
    })
    console.log("✅ User approval notification sent")

    console.log("\n3️⃣ Simulating rejection notification to user...")
    await sendPushNotification(testUser.id, {
        title: "Request Rejected (Test)",
        body: "Your test vacation request has been rejected",
        url: "/requests",
    })
    console.log("✅ User rejection notification sent")

    console.log("\n✅ Complete flow simulation finished!")
}

async function listPushSubscriptions() {
    console.log("\n📋 Current Push Subscriptions")
    console.log("================================")

    const subscriptions = await prisma.pushSubscription.findMany({
        include: {
            user: {
                select: { name: true, email: true, role: true },
            },
        },
    })

    if (subscriptions.length === 0) {
        console.log("No push subscriptions found")
        console.log("\nTo subscribe:")
        console.log("1. Navigate to /profile in your app")
        console.log("2. Click 'Enable Notifications'")
        console.log("3. Accept the browser notification permission")
        console.log("\nNote: Requires HTTPS. Run: next dev --experimental-https")
    } else {
        console.log(`Found ${subscriptions.length} subscription(s):\n`)
        subscriptions.forEach((sub, index) => {
            console.log(`${index + 1}. ${sub.user.name || sub.user.email} (${sub.user.role})`)
            console.log(`   User ID: ${sub.userId}`)
            console.log(`   Endpoint: ${sub.endpoint.substring(0, 50)}...`)
            console.log(`   Created: ${sub.createdAt.toISOString()}\n`)
        })
    }

    return subscriptions
}

async function main() {
    const args = process.argv.slice(2)
    const command = args[0]

    console.log("🔔 Time Manager - Notification Testing Script")
    console.log("==============================================\n")

    if (!command) {
        console.log("Available commands:")
        console.log("  test-email <email>           - Send test email")
        console.log("  test-push <userId>           - Send test push notification to user")
        console.log("  test-admins                  - Send test push to all admins")
        console.log("  simulate <userEmail>         - Simulate complete request notification flow")
        console.log("  list-subscriptions           - List all push subscriptions")
        console.log("\nExample:")
        console.log("  npx tsx scripts/test-notifications.ts test-email admin@example.com")
        console.log("  npx tsx scripts/test-notifications.ts test-push clxxxxxxx")
        console.log("  npx tsx scripts/test-notifications.ts test-admins")
        console.log("  npx tsx scripts/test-notifications.ts simulate user@example.com")
        console.log("  npx tsx scripts/test-notifications.ts list-subscriptions")
        process.exit(0)
    }

    try {
        switch (command) {
            case "test-email": {
                const email = args[1]
                if (!email) {
                    console.error("❌ Error: Email address required")
                    console.log("Usage: npx tsx scripts/test-notifications.ts test-email <email>")
                    process.exit(1)
                }
                await testEmail(email)
                break
            }

            case "test-push": {
                const userId = args[1]
                if (!userId) {
                    console.error("❌ Error: User ID required")
                    console.log("Usage: npx tsx scripts/test-notifications.ts test-push <userId>")
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
                    console.error("❌ Error: User email required")
                    console.log("Usage: npx tsx scripts/test-notifications.ts simulate <userEmail>")
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
                console.error(`❌ Unknown command: ${command}`)
                console.log("Run without arguments to see available commands")
                process.exit(1)
        }
    } catch (error) {
        console.error("\n❌ Error:", error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
