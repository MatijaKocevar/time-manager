import { getTranslations } from "next-intl/server"
import { DevToolsClient } from "./components/dev-tools-client"

export default async function DevToolsPage() {
    const tTestEmail = await getTranslations("admin.dev.testEmail")
    const tTestPush = await getTranslations("admin.dev.testPush")
    const tTestAdminPush = await getTranslations("admin.dev.testAdminPush")
    const tSimulateFlow = await getTranslations("admin.dev.simulateFlow")
    const tSubscriptions = await getTranslations("admin.dev.subscriptions")
    const tSubscriptionsTable = await getTranslations("admin.dev.subscriptions.table")
    const tResults = await getTranslations("admin.dev.results")
    const tCommon = await getTranslations("common.status")

    return (
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
    )
}
