import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getTranslations } from "next-intl/server"
import { QUICK_ACTIONS } from "../_constants"

export async function QuickActions() {
    const t = await getTranslations("admin.overview")

    const translations = {
        title: t("quickActions"),
        description: t("quickActionsDesc"),
        manageUsers: t("manageUsers"),
        viewPendingRequests: t("reviewPendingRequests"),
        manageShifts: t("manageHolidays"),
        viewRequestHistory: t("viewRequestHistory"),
    }

    return (
        <Card id="admin-quick-actions">
            <CardHeader>
                <CardTitle>{translations.title}</CardTitle>
                <CardDescription>{translations.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                    {QUICK_ACTIONS.map(({ labelKey, href }) => (
                        <Button
                            key={labelKey}
                            variant="outline"
                            asChild
                            className="justify-between"
                        >
                            <Link href={href}>
                                {translations[labelKey]}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
