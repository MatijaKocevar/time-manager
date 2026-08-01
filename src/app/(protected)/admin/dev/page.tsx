import { getTranslations } from "next-intl/server"
import { DevToolsClient } from "./_components/dev-tools-client"
import { getTutorialsSeen, PageTour } from "@/features/tutorial"

export default async function DevToolsPage() {
    const tTestEmail = await getTranslations("admin.dev.testEmail")
    const [tutorialsSeen, tTutorial, tAdminDev] = await Promise.all([
        getTutorialsSeen(),
        getTranslations("tutorial"),
        getTranslations("tutorial.adminDev"),
    ])
    const tTestPush = await getTranslations("admin.dev.testPush")
    const tTestAdminPush = await getTranslations("admin.dev.testAdminPush")
    const tSimulateFlow = await getTranslations("admin.dev.simulateFlow")
    const tSubscriptions = await getTranslations("admin.dev.subscriptions")
    const tSubscriptionsTable = await getTranslations("admin.dev.subscriptions.table")
    const tResults = await getTranslations("admin.dev.results")
    const tCommon = await getTranslations("common.status")

    return (
        <>
            <PageTour
                pageKey="/admin/dev"
                seenPages={tutorialsSeen}
                nextLabel={tTutorial("next")}
                prevLabel={tTutorial("previous")}
                doneLabel={tTutorial("done")}
                steps={[
                    {
                        element: "#dev-test-email",
                        title: tAdminDev("testEmail.title"),
                        description: tAdminDev("testEmail.description"),
                        side: "bottom",
                    },
                    {
                        element: "#dev-test-push",
                        title: tAdminDev("testPush.title"),
                        description: tAdminDev("testPush.description"),
                        side: "bottom",
                    },
                    {
                        element: "#dev-test-admin-push",
                        title: tAdminDev("testAdminPush.title"),
                        description: tAdminDev("testAdminPush.description"),
                        side: "bottom",
                    },
                    {
                        element: "#dev-simulate-flow",
                        title: tAdminDev("simulateFlow.title"),
                        description: tAdminDev("simulateFlow.description"),
                        side: "bottom",
                    },
                    {
                        element: "#dev-subscriptions",
                        title: tAdminDev("subscriptions.title"),
                        description: tAdminDev("subscriptions.description"),
                        side: "bottom",
                    },
                ]}
            />
            <DevToolsClient
                translations={{
                    testEmail: {
                        title: tTestEmail("title"),
                        description: tTestEmail("description"),
                        recipientLabel: tTestEmail("recipientLabel"),
                        recipientPlaceholder: tTestEmail("recipientPlaceholder"),
                        button: tTestEmail("button"),
                    },
                    testPush: {
                        title: tTestPush("title"),
                        description: tTestPush("description"),
                        userIdLabel: tTestPush("userIdLabel"),
                        userIdPlaceholder: tTestPush("userIdPlaceholder"),
                        button: tTestPush("button"),
                    },
                    testAdminPush: {
                        title: tTestAdminPush("title"),
                        description: tTestAdminPush("description"),
                        button: tTestAdminPush("button"),
                    },
                    simulateFlow: {
                        title: tSimulateFlow("title"),
                        description: tSimulateFlow("description"),
                        userEmailLabel: tSimulateFlow("userEmailLabel"),
                        userEmailPlaceholder: tSimulateFlow("userEmailPlaceholder"),
                        button: tSimulateFlow("button"),
                    },
                    subscriptions: {
                        title: tSubscriptions("title"),
                        description: tSubscriptions("description"),
                        button: tSubscriptions("button"),
                        subscriptionText: tSubscriptions("subscriptionText"),
                        table: {
                            user: tSubscriptionsTable("user"),
                            email: tSubscriptionsTable("email"),
                            role: tSubscriptionsTable("role"),
                            created: tSubscriptionsTable("created"),
                        },
                    },
                    results: {
                        admins: tResults("admins"),
                    },
                    loading: tCommon("loading"),
                }}
            />
        </>
    )
}
