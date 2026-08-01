import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth-helpers"
import { getTranslations } from "next-intl/server"
import { AttendanceView } from "./_components/attendance-view"
import { fetchTeamStatus } from "./_actions/attendance-actions"

export const dynamic = "force-dynamic"

export default async function UrnikNetAttendancePage() {
    await requireAuth().catch(() => redirect("/login"))

    const [t, result] = await Promise.all([
        getTranslations("urnikNetAttendance"),
        fetchTeamStatus(),
    ])

    const translations = {
        pageTitle: t("pageTitle"),
        present: t("present"),
        absent: t("absent"),
        unreachable: t("unreachable"),
        workFromHome: t("workFromHome"),
        noData: t("noData"),
        search: t("search"),
        showing: t("showing"),
        errorTitle: t("errorTitle"),
        structureChangedWarning: t("structureChangedWarning"),
        structureChangedDescription: t("structureChangedDescription"),
    }

    return <AttendanceView result={result} translations={translations} />
}
